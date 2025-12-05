# Soru Havuzu Sistemi Tasarım Dokümantasyonu

## Genel Bakış

Bu sistem, ders oturumları içinde belirli konularda soru üretmek, JSON formatında kaydetmek ve test için büyük bir soru havuzu oluşturmak için tasarlanmıştır. **Manuel olarak başlatılan batch işlemler** ile toplu soru üretimi yapılır. Ücretsiz modeller kullanıldığı için promptlar detaylandırılmıştır ve soru kalitesi LLM ile otomatik değerlendirilir. Zorluk seviyeleri **Bloom Taksonomisi** seviyelerine göre rastgele oluşturulur.

## Sistem Mimarisi

### 1. Veritabanı Şeması

#### `question_pool` Tablosu

```sql
CREATE TABLE IF NOT EXISTS question_pool (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    topic_id INTEGER,  -- NULL olabilir (genel sorular için)
    topic_title TEXT,  -- Konu başlığı (cache için)
    
    -- Soru içeriği
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',  -- multiple_choice, open_ended, true_false
    difficulty_level TEXT DEFAULT 'intermediate',  -- beginner, intermediate, advanced (eski sistem uyumluluğu için)
    bloom_level TEXT,  -- remember, understand, apply, analyze, evaluate, create (Bloom Taksonomisi) (eski sistem uyumluluğu için)
    bloom_level TEXT,  -- remember, understand, apply, analyze, evaluate, create (Bloom Taksonomisi)
    
    -- Çoktan seçmeli sorular için
    options JSON,  -- {"A": "seçenek1", "B": "seçenek2", ...}
    correct_answer TEXT,  -- "A", "B", "C", "D" veya açık uçlu için doğru cevap metni
    explanation TEXT,  -- Doğru cevabın açıklaması
    
    -- Chunk ilişkileri
    related_chunk_ids TEXT,  -- JSON array: ["chunk_id1", "chunk_id2", ...]
    source_chunks JSON,  -- Chunk metadata'ları (cache için)
    
    -- Metadata
    generation_method TEXT DEFAULT 'llm_generated',  -- llm_generated, manual, synthetic
    generation_model TEXT,  -- Kullanılan model (örn: "llama-3.1-8b-instant")
    generation_prompt TEXT,  -- Kullanılan prompt (opsiyonel, debug için)
    confidence_score REAL DEFAULT 0.0,  -- Üretim güven skoru (0-1)
    
    -- Kalite Değerlendirmesi (LLM ile)
    quality_score REAL,  -- Soru kalitesi skoru (0-1)
    quality_evaluation TEXT,  -- LLM'in kalite değerlendirmesi (JSON)
    usability_score REAL,  -- Kullanılabilirlik skoru (0-1)
    is_approved_by_llm BOOLEAN DEFAULT FALSE,  -- LLM tarafından onaylandı mı?
    quality_check_model TEXT,  -- Kalite kontrolünde kullanılan model
    
    -- Benzerlik ve Duplicate Kontrolü
    similarity_score REAL,  -- En benzer soru ile benzerlik skoru (0-1)
    most_similar_question_id INTEGER,  -- En benzer sorunun ID'si
    is_duplicate BOOLEAN DEFAULT FALSE,  -- Duplicate olarak işaretlendi mi?
    duplicate_reason TEXT,  -- Duplicate nedeni (örn: "Çok yüksek benzerlik (0.95)")
    
    -- Kullanım istatistikleri
    times_used INTEGER DEFAULT 0,  -- Kaç kez kullanıldı
    times_answered_correctly INTEGER DEFAULT 0,  -- Kaç kez doğru cevaplandı
    average_response_time REAL,  -- Ortalama cevaplama süresi (saniye)
    
    -- Durum
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,  -- Öne çıkarılmış sorular
    is_validated BOOLEAN DEFAULT FALSE,  -- Manuel doğrulama yapıldı mı?
    validation_notes TEXT,  -- Doğrulama notları
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_used_at TEXT,
    validated_at TEXT
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_question_pool_session ON question_pool(session_id);
CREATE INDEX IF NOT EXISTS idx_question_pool_topic ON question_pool(topic_id);
CREATE INDEX IF NOT EXISTS idx_question_pool_difficulty ON question_pool(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_question_pool_active ON question_pool(is_active);
CREATE INDEX IF NOT EXISTS idx_question_pool_featured ON question_pool(is_featured);
CREATE INDEX IF NOT EXISTS idx_question_pool_created ON question_pool(created_at);
CREATE INDEX IF NOT EXISTS idx_question_pool_duplicate ON question_pool(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_question_pool_question_text ON question_pool(question_text);  -- Benzerlik kontrolü için
```

#### `question_pool_batch_jobs` Tablosu (Batch İşlemler İçin)

```sql
CREATE TABLE IF NOT EXISTS question_pool_batch_jobs (
    job_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    job_type TEXT NOT NULL,  -- 'topic_batch', 'full_session', 'custom'
    
    -- Parametreler
    topic_ids TEXT,  -- JSON array: [1, 2, 3] veya NULL (tüm konular)
    difficulty_levels TEXT,  -- JSON array: ["beginner", "intermediate", "advanced"] (eski sistem uyumluluğu)
    bloom_levels TEXT,  -- JSON array: ["remember", "understand", "apply", "analyze", "evaluate", "create"]
    questions_per_topic INTEGER DEFAULT 10,
    questions_per_bloom_level INTEGER,  -- Her Bloom seviyesi için soru sayısı (rastgele dağıtım için)
    total_questions_target INTEGER NOT NULL,  -- Toplam hedef soru sayısı (ZORUNLU)
    custom_topic TEXT,  -- Özel konu başlığı (topic_ids yoksa kullanılır)
    custom_prompt TEXT,  -- Özel prompt (kullanıcı girişi)
    prompt_instructions TEXT,  -- Ek talimatlar (kullanıcı girişi)
    use_default_prompts BOOLEAN DEFAULT TRUE,  -- Varsayılan Bloom promptlarını kullan
    enable_quality_check BOOLEAN DEFAULT TRUE,  -- LLM kalite kontrolü aktif mi?
    quality_threshold REAL DEFAULT 0.7,  -- Minimum kalite skoru (bu altındakiler reddedilir)
    enable_duplicate_check BOOLEAN DEFAULT TRUE,  -- Duplicate/benzerlik kontrolü aktif mi?
    similarity_threshold REAL DEFAULT 0.85,  -- Benzerlik eşik değeri (bu üstündekiler duplicate sayılır, 0-1)
    duplicate_check_method TEXT DEFAULT 'embedding',  -- 'embedding' veya 'llm' veya 'both'
    
    -- Durum
    status TEXT DEFAULT 'pending',  -- pending, running, completed, failed, cancelled
    progress_current INTEGER DEFAULT 0,  -- Şu ana kadar üretilen soru sayısı
    progress_total INTEGER,  -- Toplam hedef
    
    -- Sonuçlar
    questions_generated INTEGER DEFAULT 0,
    questions_failed INTEGER DEFAULT 0,
    questions_rejected_by_quality INTEGER DEFAULT 0,  -- Kalite kontrolünden geçemeyen sorular
    questions_rejected_by_duplicate INTEGER DEFAULT 0,  -- Duplicate/benzerlik kontrolünden geçemeyen sorular
    questions_approved INTEGER DEFAULT 0,  -- Onaylanan sorular
    error_message TEXT,
    
    -- Metadata
    created_by INTEGER,  -- user_id
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_jobs_session ON question_pool_batch_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON question_pool_batch_jobs(status);
```

### 2. API Endpoint'leri

#### 2.1. Tekil Soru Üretimi

**POST** `/api/aprag/topics/{topic_id}/generate-questions`

Mevcut endpoint'i genişletilmiş versiyonu:

```python
@router.post("/topics/{topic_id}/generate-questions-to-pool")
async def generate_questions_to_pool(
    topic_id: int, 
    request: QuestionGenerationRequest
):
    """
    Belirli bir konu için soru üretir ve question_pool tablosuna kaydeder.
    
    Request Body:
    {
        "count": 10,
        "difficulty_level": "intermediate",  # optional
        "question_types": ["multiple_choice", "open_ended"],  # optional
        "save_to_pool": true,  # Soruları havuzda sakla
        "related_chunk_ids": ["chunk1", "chunk2"]  # optional, otomatik bulunur
    }
    
    Response:
    {
        "success": true,
        "topic_id": 1,
        "topic_title": "Python Temelleri",
        "questions_generated": 10,
        "questions": [
            {
                "question_id": 123,
                "question_text": "...",
                "difficulty_level": "intermediate",
                "related_chunk_ids": ["chunk1", "chunk2"],
                ...
            }
        ]
    }
    """
```

#### 2.2. Batch Soru Üretimi (Manuel Başlatma - Özelleştirilebilir)

**POST** `/api/aprag/question-pool/batch-generate`

```python
@router.post("/question-pool/batch-generate")
async def batch_generate_questions(
    request: BatchQuestionGenerationRequest
):
    """
    Toplu soru üretimi - MANUEL OLARAK BAŞLATILIR.
    Ücretsiz modeller kullanıldığı için detaylı promptlar ve LLM kalite kontrolü yapılır.
    Bloom Taksonomisi seviyelerine göre rastgele soru üretilir.
    
    Kullanıcı özel prompt, konu ve soru sayısı girebilir.
    
    Request Body:
    {
        "session_id": "abc123",
        "job_type": "topic_batch",  # topic_batch, full_session, custom
        
        // Konu Seçimi
        "topic_ids": [1, 2, 3],  # optional, NULL ise tüm konular
        "custom_topic": "Python Decorators",  # optional, özel konu başlığı (topic_ids yoksa kullanılır)
        
        // Soru Sayısı
        "total_questions_target": 100,  # Toplam hedef soru sayısı (ZORUNLU)
        "questions_per_topic": 20,  # optional, topic_ids varsa konu başına soru sayısı
        "questions_per_bloom_level": 5,  # optional, Her Bloom seviyesi için soru sayısı
        
        // Bloom Taksonomisi
        "bloom_levels": ["remember", "understand", "apply", "analyze", "evaluate", "create"],
        // veya otomatik rastgele dağıtım için:
        "use_random_bloom_distribution": true,  # Bloom seviyelerini otomatik dağıt
        
        // Özel Prompt (Kullanıcı Girişi)
        "custom_prompt": "Sadece kod örnekleri içeren sorular üret. Her soruda mutlaka bir Python kodu parçası olsun.",  # optional
        "prompt_instructions": "Sorular pratik uygulamaya odaklı olsun",  # optional, ek talimatlar
        "use_default_prompts": true,  # false ise sadece custom_prompt kullanılır
        
        // Kalite Kontrolü
        "enable_quality_check": true,  # LLM kalite kontrolü aktif mi?
        "quality_threshold": 0.7,  # Minimum kalite skoru (0-1)
        
        // Diğer
        "priority_topics": [1, 5],  # Öncelikli konular (optional)
        "async": true  # Arka planda çalıştır
    }
    
    Response:
    {
        "success": true,
        "job_id": 456,
        "status": "running",
        "estimated_completion": "2024-01-15T10:30:00Z",
        "message": "Batch soru üretimi başlatıldı. İşlem arka planda devam edecek."
    }
    """
```

#### 2.3. Batch İş Durumu Kontrolü

**GET** `/api/aprag/question-pool/batch-jobs/{job_id}`

```python
@router.get("/question-pool/batch-jobs/{job_id}")
async def get_batch_job_status(job_id: int):
    """
    Batch iş durumunu kontrol eder.
    
    Response:
    {
        "job_id": 456,
        "status": "running",
        "progress_current": 45,
        "progress_total": 100,
        "questions_generated": 45,
        "questions_failed": 2,
        "questions_rejected_by_quality": 5,
        "questions_approved": 40,
        "estimated_time_remaining": "5 minutes"
    }
    """
```

#### 2.4. Soru Havuzunu Listeleme

**GET** `/api/aprag/question-pool/list`

```python
@router.get("/question-pool/list")
async def list_question_pool(
    session_id: str,
    topic_id: Optional[int] = None,
    difficulty_level: Optional[str] = None,
    is_active: bool = True,
    limit: int = 50,
    offset: int = 0
):
    """
    Soru havuzundan soruları listeler.
    
    Query Parameters:
    - session_id: Zorunlu
    - topic_id: Filtreleme için
    - difficulty_level: Filtreleme için
    - is_active: Sadece aktif sorular
    - limit, offset: Sayfalama
    
    Response:
    {
        "total": 150,
        "questions": [...],
        "pagination": {
            "limit": 50,
            "offset": 0,
            "has_more": true
        }
    }
    """
```

#### 2.5. Soru Havuzunu JSON Olarak Export Etme

**GET** `/api/aprag/question-pool/export`

```python
@router.get("/question-pool/export")
async def export_question_pool(
    session_id: str,
    format: str = "json",  # json, csv, xlsx
    topic_id: Optional[int] = None,
    difficulty_level: Optional[str] = None
):
    """
    Soru havuzunu JSON/CSV/Excel formatında export eder.
    
    Response (JSON):
    {
        "session_id": "abc123",
        "export_date": "2024-01-15T10:00:00Z",
        "total_questions": 150,
        "questions": [
            {
                "question_id": 1,
                "topic_id": 1,
                "topic_title": "Python Temelleri",
                "question_text": "...",
                "question_type": "multiple_choice",
                "difficulty_level": "intermediate",
                "options": {...},
                "correct_answer": "A",
                "explanation": "...",
                "related_chunk_ids": ["chunk1", "chunk2"],
                "source_chunks": [...],
                "created_at": "..."
            },
            ...
        ]
    }
    """
```

### 3. Frontend UI Tasarımı

#### 3.1. Ders Oturumu Sayfasına Eklenen Bölüm

**Konum:** `frontend/app/sessions/[sessionId]/page.tsx`

Yeni bir tab veya panel eklenir:

```tsx
// Yeni Tab: "Soru Havuzu"
<TabsTrigger value="question-pool">
  <FileText className="mr-2 h-4 w-4" />
  Soru Havuzu
</TabsTrigger>

<TabsContent value="question-pool">
  <QuestionPoolPanel sessionId={sessionId} />
</TabsContent>
```

#### 3.2. Soru Havuzu Paneli Komponenti

**Dosya:** `frontend/components/QuestionPoolPanel.tsx`

```tsx
interface QuestionPoolPanelProps {
  sessionId: string;
}

export default function QuestionPoolPanel({ sessionId }: QuestionPoolPanelProps) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [batchJob, setBatchJob] = useState(null);
  const [filters, setFilters] = useState({
    topic_id: null,
    difficulty_level: null,
    is_active: true
  });

  // Batch soru üretimi
  const handleBatchGenerate = async (config) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/aprag/question-pool/batch-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          ...config,
          async: true
        })
      });
      const data = await response.json();
      setBatchJob(data);
      // Poll job status
      pollJobStatus(data.job_id);
    } catch (error) {
      console.error('Batch generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // JSON export
  const handleExport = async () => {
    const response = await fetch(
      `${getApiUrl()}/aprag/question-pool/export?session_id=${sessionId}&format=json`
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question-pool-${sessionId}-${Date.now()}.json`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soru Havuzu Yönetimi</CardTitle>
        <CardDescription>
          Belirli konularda soru üretin ve test için büyük bir soru havuzu oluşturun
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Batch Üretim Butonu */}
        <div className="mb-4">
          <Button 
            onClick={() => setShowBatchModal(true)}
            disabled={loading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Toplu Soru Üret
          </Button>
          <Button 
            onClick={handleExport}
            variant="outline"
            className="ml-2"
          >
            <Download className="mr-2 h-4 w-4" />
            JSON Export
          </Button>
        </div>

        {/* Batch İş Durumu */}
        {batchJob && (
          <BatchJobStatus jobId={batchJob.job_id} />
        )}

        {/* Filtreler */}
        <QuestionPoolFilters 
          filters={filters} 
          onChange={setFilters}
          sessionId={sessionId}
        />

        {/* Soru Listesi */}
        <QuestionPoolList 
          sessionId={sessionId}
          filters={filters}
        />
      </CardContent>
    </Card>
  );
}
```

#### 3.3. Batch Üretim Modal'ı

**Dosya:** `frontend/components/BatchQuestionGenerationModal.tsx`

```tsx
interface BatchQuestionGenerationModalProps {
  sessionId: string;
  topics: Topic[];
  onClose: () => void;
  onGenerate: (config: BatchConfig) => void;
}

export default function BatchQuestionGenerationModal({
  sessionId,
  topics,
  onClose,
  onGenerate
}: BatchQuestionGenerationModalProps) {
  const [config, setConfig] = useState({
    job_type: 'topic_batch',
    topic_ids: [],
    custom_topic: '',  // Özel konu girişi
    total_questions_target: 100,  // Toplam soru sayısı (zorunlu)
    questions_per_topic: null,  // Konu başına soru (optional)
    bloom_levels: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    use_random_bloom_distribution: true,  // Otomatik Bloom dağıtımı
    custom_prompt: '',  // Özel prompt girişi
    prompt_instructions: '',  // Ek talimatlar
    use_default_prompts: true,  // Varsayılan promptları kullan
    enable_quality_check: true,
    quality_threshold: 0.7
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplu Soru Üretimi</DialogTitle>
          <DialogDescription>
            Manuel olarak başlatılan toplu soru üretim işlemi. Ücretsiz modeller kullanılır ve soru kalitesi LLM ile otomatik değerlendirilir.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Soru Sayısı (ZORUNLU) */}
          <div>
            <Label>Toplam Soru Sayısı *</Label>
            <Input
              type="number"
              min="1"
              max="1000"
              value={config.total_questions_target}
              onChange={(e) => setConfig({
                ...config,
                total_questions_target: parseInt(e.target.value) || 0
              })}
              placeholder="Örn: 100"
            />
            <p className="text-sm text-gray-500 mt-1">
              Toplam üretilecek soru sayısı (zorunlu)
            </p>
          </div>

          {/* Konu Seçimi */}
          <div>
            <Label>Konu Seçimi</Label>
            <Select
              value={config.job_type}
              onValueChange={(value) => setConfig({...config, job_type: value})}
            >
              <SelectItem value="topic_batch">Belirli Konular</SelectItem>
              <SelectItem value="full_session">Tüm Konular</SelectItem>
              <SelectItem value="custom">Özel Konu</SelectItem>
            </Select>
            
            {config.job_type === 'topic_batch' && (
              <div className="mt-2">
                <MultiSelect
                  options={topics.map(t => ({value: t.topic_id, label: t.topic_title}))}
                  selected={config.topic_ids}
                  onChange={(ids) => setConfig({...config, topic_ids: ids})}
                />
                {config.topic_ids.length > 0 && (
                  <div className="mt-2">
                    <Label>Konu Başına Soru Sayısı (Opsiyonel)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={config.questions_per_topic || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        questions_per_topic: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="Boş bırakılırsa otomatik dağıtılır"
                    />
                  </div>
                )}
              </div>
            )}

            {config.job_type === 'custom' && (
              <div className="mt-2">
                <Label>Özel Konu Başlığı</Label>
                <Input
                  value={config.custom_topic}
                  onChange={(e) => setConfig({...config, custom_topic: e.target.value})}
                  placeholder="Örn: Python Decorators, Veri Yapıları, Algoritma Analizi"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bu konu için soru üretilecek. Session'daki chunk'lar kullanılacak.
                </p>
              </div>
            )}
          </div>

          {/* Bloom Taksonomisi Seviyeleri */}
          <div>
            <Label>Bloom Taksonomisi Seviyeleri</Label>
            <CheckboxGroup
              options={[
                {value: 'remember', label: 'Remember (Hatırlama)'},
                {value: 'understand', label: 'Understand (Anlama)'},
                {value: 'apply', label: 'Apply (Uygulama)'},
                {value: 'analyze', label: 'Analyze (Analiz)'},
                {value: 'evaluate', label: 'Evaluate (Değerlendirme)'},
                {value: 'create', label: 'Create (Yaratma)'}
              ]}
              selected={config.bloom_levels}
              onChange={(levels) => setConfig({...config, bloom_levels: levels})}
            />
            <p className="text-sm text-gray-500 mt-1">
              Seçilen seviyeler rastgele dağıtılacak. Tüm seviyeler seçilirse otomatik ağırlıklandırma yapılır.
            </p>
          </div>

          {/* Kalite Kontrolü */}
          <div>
            <Label>Kalite Kontrolü</Label>
            <Checkbox
              checked={config.enable_quality_check}
              onChange={(checked) => setConfig({...config, enable_quality_check: checked})}
            >
              LLM ile kalite kontrolü aktif
            </Checkbox>
            {config.enable_quality_check && (
              <div className="mt-2">
                <Label>Minimum Kalite Skoru (0-1)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.quality_threshold}
                  onChange={(e) => setConfig({
                    ...config,
                    quality_threshold: parseFloat(e.target.value)
                  })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Bu skorun altındaki sorular reddedilir (önerilen: 0.7)
                </p>
              </div>
            )}
          </div>

          {/* Özel Prompt */}
          <div>
            <Label>Özel Prompt (Opsiyonel)</Label>
            <Textarea
              value={config.custom_prompt}
              onChange={(e) => setConfig({...config, custom_prompt: e.target.value})}
              placeholder="Örn: Sadece kod örnekleri içeren sorular üret. Her soruda mutlaka bir Python kodu parçası olsun."
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              Özel talimatlar ekleyebilirsiniz. Boş bırakılırsa varsayılan promptlar kullanılır.
            </p>
            
            <div className="mt-2">
              <Checkbox
                checked={config.use_default_prompts}
                onChange={(checked) => setConfig({...config, use_default_prompts: checked})}
              >
                Varsayılan Bloom promptlarını kullan
              </Checkbox>
              <p className="text-sm text-gray-500 mt-1">
                İşaretli ise: Özel prompt + Bloom seviyesine özel promptlar birleştirilir
                İşaretsiz ise: Sadece özel prompt kullanılır
              </p>
            </div>
          </div>

          {/* Ek Talimatlar */}
          <div>
            <Label>Ek Talimatlar (Opsiyonel)</Label>
            <Textarea
              value={config.prompt_instructions}
              onChange={(e) => setConfig({...config, prompt_instructions: e.target.value})}
              placeholder="Örn: Sorular pratik uygulamaya odaklı olsun, gerçek hayat örnekleri içersin"
              rows={2}
            />
            <p className="text-sm text-gray-500 mt-1">
              Prompt'a eklenecek ek talimatlar
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={() => onGenerate(config)}>
            Üretimi Başlat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. İş Akışı

#### 4.1. Tekil Soru Üretimi Akışı

```
1. Kullanıcı ders oturumu sayfasında "Soru Havuzu" tab'ına gider
2. Bir konu seçer ve "Soru Üret" butonuna tıklar
3. Backend:
   a. Konu bilgilerini alır (course_topics tablosundan)
   b. Konuya bağlı chunk'ları bulur (related_chunk_ids veya otomatik eşleştirme)
   c. LLM'e prompt gönderir (mevcut generate_questions_for_topic fonksiyonu)
   d. Üretilen soruları parse eder
   e. Her soru için:
      - question_pool tablosuna kaydeder
      - related_chunk_ids'i ekler
      - source_chunks metadata'sını cache'ler
      - difficulty_level, topic_id, vb. bilgileri ekler
4. Frontend'e response döner
5. Kullanıcı soruları görür ve JSON export edebilir
```

#### 4.2. Batch Soru Üretimi Akışı (Manuel Başlatma, Özel Prompt, Bloom Taksonomisi, LLM Kalite Kontrolü)

```
1. Kullanıcı "Toplu Soru Üret" butonuna tıklar (MANUEL BAŞLATMA)
2. Modal açılır, parametreler seçilir:
   - Toplam soru sayısı (ZORUNLU, örn: 100)
   - Konu seçimi:
     * Belirli konular (topic_ids)
     * Tüm konular (full_session)
     * Özel konu (custom_topic: "Python Decorators")
   - Bloom Taksonomisi seviyeleri (remember, understand, apply, analyze, evaluate, create)
   - Özel prompt (opsiyonel): "Sadece kod örnekleri içeren sorular üret..."
   - Ek talimatlar (opsiyonel): "Sorular pratik uygulamaya odaklı olsun"
   - Varsayılan promptları kullan (checkbox)
   - Kalite kontrolü aktif/pasif
   - Minimum kalite skoru (quality_threshold)
3. Backend:
   a. question_pool_batch_jobs tablosuna job kaydı ekler (status: 'pending')
   b. Async task başlatır (background thread)
   c. Konu belirleme:
      - Eğer topic_ids varsa: Seçili konular
      - Eğer custom_topic varsa: Özel konu başlığı kullan (chunk'lar session'dan alınır)
      - Değilse: Tüm konular
   d. Bloom seviyelerini dağıt:
      - Eğer use_random_bloom_distribution: Otomatik ağırlıklandırma
      - Değilse: Seçili bloom_levels kullan
   e. Her konu için:
      - Her Bloom seviyesi için:
         * PROMPT BİRLEŞTİRME:
            - Eğer use_default_prompts: Bloom seviyesine özel prompt + custom_prompt + prompt_instructions
            - Değilse: Sadece custom_prompt + prompt_instructions
         * LLM'e soru üretim isteği gönder (ücretsiz model)
         * Üretilen soruyu parse et
         * KALİTE KONTROLÜ (LLM ile, eğer aktifse):
            - Soru kalitesi değerlendirmesi
            - Kullanılabilirlik kontrolü
            - Bloom seviyesine uygunluk kontrolü
            - quality_score ve usability_score hesapla
         * Eğer quality_check aktif ve quality_score >= quality_threshold:
            - question_pool'a kaydet (is_approved_by_llm = TRUE)
            - questions_approved++
         * Değilse (quality_check pasif veya skor yeterli):
            - question_pool'a kaydet (is_approved_by_llm = FALSE veya TRUE)
            - questions_generated++
         * Eğer quality_check aktif ve quality_score < quality_threshold:
            - Reddet (questions_rejected_by_quality++)
         * Eğer duplicate_check aktif ve similarity_score >= similarity_threshold:
            - Reddet (questions_rejected_by_duplicate++)
            - Soruyu duplicate olarak işaretle (is_duplicate = TRUE)
         * Progress güncelle (her 10 soruda bir)
   f. Job tamamlandığında status: 'completed'
4. Frontend:
   a. Job ID alır
   b. Polling ile job durumunu kontrol eder (her 5 saniyede bir)
   c. Progress bar gösterir:
      - Toplam: 100 soru
      - Üretilen: 85 soru
      - Onaylanan: 75 soru
      - Reddedilen: 10 soru
   d. Tamamlandığında bildirim gösterir
```

### 5. JSON Export Formatı

```json
{
  "session_id": "abc123",
  "session_title": "Python Programlama Dersi",
  "export_date": "2024-01-15T10:00:00Z",
  "total_questions": 150,
  "metadata": {
    "exported_by": "user@example.com",
    "export_format_version": "1.0"
  },
  "questions": [
    {
      "question_id": 1,
      "topic_id": 1,
      "topic_title": "Python Temelleri",
      "question_text": "Python'da listelerin özelliği nedir?",
      "question_type": "multiple_choice",
      "difficulty_level": "intermediate",
      "bloom_level": "understand",
      "quality_score": 0.85,
      "usability_score": 0.90,
      "is_approved_by_llm": true,
      "quality_evaluation": {
        "strengths": ["Soru açık ve anlaşılır", "Materyaldeki bilgilere dayalı"],
        "weaknesses": [],
        "recommendations": []
      },
      "similarity_score": 0.12,
      "is_duplicate": false,
      "options": {
        "A": "Mutable veri yapılarıdır",
        "B": "Immutable veri yapılarıdır",
        "C": "Sadece string içerebilir",
        "D": "Sadece sayı içerebilir"
      },
      "correct_answer": "A",
      "explanation": "Python listeleri mutable (değiştirilebilir) veri yapılarıdır. Elemanları eklenebilir, çıkarılabilir veya değiştirilebilir.",
      "related_chunk_ids": [
        "chunk_abc123",
        "chunk_def456"
      ],
      "source_chunks": [
        {
          "chunk_id": "chunk_abc123",
          "document_name": "python_basics.pdf",
          "chunk_index": 5,
          "chunk_text": "Python'da listeler mutable veri yapılarıdır..."
        },
        {
          "chunk_id": "chunk_def456",
          "document_name": "python_basics.pdf",
          "chunk_index": 6,
          "chunk_text": "Listelerde eleman ekleme ve çıkarma işlemleri..."
        }
      ],
      "generation_method": "llm_generated",
      "generation_model": "llama-3.1-8b-instant",
      "confidence_score": 0.85,
      "times_used": 0,
      "is_active": true,
      "is_featured": false,
      "is_validated": false,
      "created_at": "2024-01-15T09:30:00Z"
    }
  ],
  "statistics": {
    "by_topic": {
      "1": 25,
      "2": 30,
      "3": 20
    },
    "by_difficulty": {
      "beginner": 50,
      "intermediate": 70,
      "advanced": 30
    },
    "by_bloom_level": {
      "remember": 40,
      "understand": 50,
      "apply": 30,
      "analyze": 20,
      "evaluate": 7,
      "create": 3
    },
    "by_quality": {
      "approved": 140,
      "rejected_by_quality": 10,
      "rejected_by_duplicate": 15
    },
    "by_type": {
      "multiple_choice": 120,
      "open_ended": 20,
      "true_false": 10
    }
  }
}
```

### 6. Detaylı Prompt Şablonları ve Bloom Taksonomisi

#### 6.1. Bloom Taksonomisi Seviyeleri

Bloom Taksonomisi'nin 6 seviyesi vardır:

1. **Remember (Hatırlama)**: Bilgiyi hatırlama, tanıma, listeleme
2. **Understand (Anlama)**: Bilgiyi anlama, açıklama, özetleme
3. **Apply (Uygulama)**: Bilgiyi yeni durumlara uygulama
4. **Analyze (Analiz)**: Bilgiyi parçalara ayırma, ilişkileri bulma
5. **Evaluate (Değerlendirme)**: Bilgiyi değerlendirme, eleştirme, karşılaştırma
6. **Create (Yaratma)**: Yeni bir şey oluşturma, sentezleme

#### 6.2. Bloom Seviyesine Özel Soru Üretim Promptları

##### Remember (Hatırlama) Seviyesi

```python
REMEMBER_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için HATIRLAMA seviyesinde sorular üret.

BLOOM SEVİYESİ: REMEMBER (Hatırlama)
Bu seviyede öğrenci:
- Bilgileri hatırlamalı
- Tanımları, isimleri, tarihleri, sayıları bilmeli
- Temel kavramları ezberlemeli
- Doğrudan materyalden bilgi almalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki SPESİFİK bilgilerden {count} adet çoktan seçmeli soru üret
2. Sorular doğrudan materyaldeki GERÇEK bilgilere dayanmalı (örnek: "X nedir?", "Y kaçtır?", "Z kimdir?")
3. Doğru cevap MUTLAKA materyaldeki gerçek bilgi olmalı
4. Yanlış şıklar mantıklı çeldiriciler olmalı ama materyalde olmamalı
5. Her soru için açıklama ekle (doğru cevabın neden doğru olduğunu)

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [SPESİFİK KAVRAM] nedir?",
      "options": {{
        "A": "Materyaldeki GERÇEK bilgi (doğru cevap)",
        "B": "Mantıklı çeldirici (materyalde yok)",
        "C": "Mantıklı çeldirici (materyalde yok)",
        "D": "Mantıklı çeldirici (materyalde yok)"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın açıklaması (materyaldeki gerçek bilgiye dayalı)",
      "bloom_level": "remember"
    }}
  ]
}}"""
```

##### Understand (Anlama) Seviyesi

```python
UNDERSTAND_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için ANLAMA seviyesinde sorular üret.

BLOOM SEVİYESİ: UNDERSTAND (Anlama)
Bu seviyede öğrenci:
- Bilgiyi kendi kelimeleriyle açıklamalı
- Kavramlar arası ilişkileri anlamalı
- Örnekler vermeli veya örnekleri tanımalı
- Materyaldeki bilgiyi yorumlamalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki kavramları ANLAMA seviyesinde test eden {count} adet soru üret
2. Sorular "neden", "nasıl", "açıkla", "karşılaştır" gibi anlama gerektiren sorular olmalı
3. Doğru cevap materyaldeki bilginin yorumlanması olmalı
4. Örnek: "X kavramı neden önemlidir?", "Y nasıl çalışır?", "Z ve W arasındaki fark nedir?"

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [KAVRAM] nasıl çalışır?",
      "options": {{
        "A": "Materyaldeki bilginin yorumlanması (doğru cevap)",
        "B": "Yanlış yorumlama",
        "C": "Yanlış yorumlama",
        "D": "Yanlış yorumlama"
      }},
      "correct_answer": "A",
      "explanation": "Doğru cevabın detaylı açıklaması",
      "bloom_level": "understand"
    }}
  ]
}}"""
```

##### Apply (Uygulama) Seviyesi

```python
APPLY_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için UYGULAMA seviyesinde sorular üret.

BLOOM SEVİYESİ: APPLY (Uygulama)
Bu seviyede öğrenci:
- Öğrendiği bilgiyi yeni durumlara uygulamalı
- Problem çözmeli
- Kuralları kullanmalı
- Yöntemleri uygulamalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri YENİ DURUMLARA UYGULAMA gerektiren {count} adet soru üret
2. Sorular problem çözme, uygulama, kullanım gerektirmeli
3. Örnek: "X durumunda Y yöntemini nasıl kullanırsın?", "Z problemi için hangi çözüm uygundur?"
4. Doğru cevap materyaldeki yöntem/kuralın doğru uygulanması olmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "[YENİ DURUM] için materyaldeki [YÖNTEM] nasıl uygulanır?",
      "options": {{
        "A": "Doğru uygulama (materyaldeki yönteme uygun)",
        "B": "Yanlış uygulama",
        "C": "Yanlış uygulama",
        "D": "Yanlış uygulama"
      }},
      "correct_answer": "A",
      "explanation": "Neden bu uygulamanın doğru olduğu (materyaldeki yönteme dayalı)",
      "bloom_level": "apply"
    }}
  ]
}}"""
```

##### Analyze (Analiz) Seviyesi

```python
ANALYZE_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için ANALİZ seviyesinde sorular üret.

BLOOM SEVİYESİ: ANALYZE (Analiz)
Bu seviyede öğrenci:
- Bilgiyi parçalara ayırmalı
- İlişkileri bulmalı
- Neden-sonuç ilişkilerini anlamalı
- Yapıyı analiz etmeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri ANALİZ gerektiren {count} adet soru üret
2. Sorular "neden", "nasıl ilişkili", "hangi parçalar", "yapı nedir" gibi analiz gerektirmeli
3. Örnek: "X ve Y arasındaki ilişki nedir?", "Z'nin yapısı nasıldır?", "W'nun nedenleri nelerdir?"
4. Doğru cevap materyaldeki bilgilerin analizine dayanmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [KAVRAM1] ve [KAVRAM2] arasındaki ilişki nedir?",
      "options": {{
        "A": "Doğru analiz (materyaldeki ilişkiye dayalı)",
        "B": "Yanlış analiz",
        "C": "Yanlış analiz",
        "D": "Yanlış analiz"
      }},
      "correct_answer": "A",
      "explanation": "İlişkinin detaylı analizi (materyaldeki bilgilere dayalı)",
      "bloom_level": "analyze"
    }}
  ]
}}"""
```

##### Evaluate (Değerlendirme) Seviyesi

```python
EVALUATE_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için DEĞERLENDİRME seviyesinde sorular üret.

BLOOM SEVİYESİ: EVALUATE (Değerlendirme)
Bu seviyede öğrenci:
- Bilgiyi değerlendirmeli
- Eleştirel düşünmeli
- Karşılaştırmalı
- Yargıda bulunmalı

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri DEĞERLENDİRME gerektiren {count} adet soru üret
2. Sorular "hangisi daha iyi", "neden uygun", "eleştir", "karşılaştır" gibi değerlendirme gerektirmeli
3. Örnek: "X ve Y arasında hangisi daha etkilidir?", "Z yaklaşımının avantajları nelerdir?"
4. Doğru cevap materyaldeki bilgilere dayalı mantıklı değerlendirme olmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyalde bahsedilen [YAKLAŞIM1] ve [YAKLAŞIM2] arasında hangisi daha uygundur?",
      "options": {{
        "A": "Mantıklı değerlendirme (materyaldeki bilgilere dayalı)",
        "B": "Yanlış değerlendirme",
        "C": "Yanlış değerlendirme",
        "D": "Yanlış değerlendirme"
      }},
      "correct_answer": "A",
      "explanation": "Değerlendirmenin gerekçesi (materyaldeki bilgilere dayalı)",
      "bloom_level": "evaluate"
    }}
  ]
}}"""
```

##### Create (Yaratma) Seviyesi

```python
CREATE_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için YARATMA seviyesinde sorular üret.

BLOOM SEVİYESİ: CREATE (Yaratma)
Bu seviyede öğrenci:
- Yeni bir şey oluşturmalı
- Sentez yapmalı
- Tasarım yapmalı
- Özgün çözüm üretmeli

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {keywords}
DERS MATERYALİ:
{chunks_text}

LÜTFEN ŞUNLARI YAP:
1. Materyaldeki bilgileri kullanarak YARATMA gerektiren {count} adet soru üret
2. Sorular "oluştur", "tasarla", "geliştir", "sentezle" gibi yaratma gerektirmeli
3. Örnek: "X durumu için Y çözümü nasıl tasarlarsın?", "Z problemini çözmek için hangi yaklaşımı oluşturursun?"
4. Doğru cevap materyaldeki bilgilere dayalı mantıklı yaratım olmalı

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "questions": [
    {{
      "question": "Materyaldeki bilgileri kullanarak [DURUM] için [ÇÖZÜM TİPİ] nasıl tasarlarsın?",
      "options": {{
        "A": "Mantıklı yaratım (materyaldeki bilgilere dayalı)",
        "B": "Yanlış yaklaşım",
        "C": "Yanlış yaklaşım",
        "D": "Yanlış yaklaşım"
      }},
      "correct_answer": "A",
      "explanation": "Yaratımın gerekçesi (materyaldeki bilgilere dayalı)",
      "bloom_level": "create"
    }}
  ]
}}"""
```

#### 6.3. LLM Kalite Değerlendirme Promptu

```python
QUALITY_CHECK_PROMPT = """Sen bir eğitim uzmanısın. Aşağıdaki soruyu kalite ve kullanılabilirlik açısından değerlendir.

SORU:
{question_text}

SEÇENEKLER:
{options}

DOĞRU CEVAP:
{correct_answer}

AÇIKLAMA:
{explanation}

BLOOM SEVİYESİ:
{bloom_level}

KONU:
{topic_title}

DERS MATERYALİ (KAYNAK):
{source_chunks_text}

LÜTFEN ŞUNLARI DEĞERLENDİR:

1. **Soru Kalitesi (0-1 arası skor)**:
   - Soru açık ve anlaşılır mı?
   - Soru materyaldeki bilgilere dayalı mı?
   - Soru belirtilen Bloom seviyesine uygun mu?
   - Seçenekler mantıklı ve dengeli mi?
   - Doğru cevap kesin ve doğru mu?

2. **Kullanılabilirlik (0-1 arası skor)**:
   - Soru öğrenci için uygun seviyede mi?
   - Soru eğitsel değere sahip mi?
   - Soru tekrar kullanılabilir mi?
   - Soru test ortamında kullanılabilir mi?

3. **Bloom Seviyesi Uygunluğu**:
   - Soru gerçekten belirtilen Bloom seviyesini test ediyor mu?
   - Örnek: "remember" seviyesinde soru sadece hatırlama gerektirmeli, analiz gerektirmemeli

ÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):
{{
  "quality_score": 0.85,  // 0-1 arası
  "usability_score": 0.90,  // 0-1 arası
  "is_approved": true,  // quality_score >= threshold ise true
  "bloom_level_match": true,  // Bloom seviyesine uygun mu?
  "evaluation": {{
    "strengths": [
      "Soru açık ve anlaşılır",
      "Materyaldeki bilgilere dayalı",
      "Bloom seviyesine uygun"
    ],
    "weaknesses": [
      "Bir seçenek biraz belirsiz"
    ],
    "recommendations": [
      "Seçenek B'yi daha net hale getir"
    ]
  }},
  "detailed_scores": {{
    "clarity": 0.9,  // Soru açıklığı
    "material_based": 0.95,  // Materyale dayalılık
    "bloom_appropriate": 0.85,  // Bloom seviyesi uygunluğu
    "options_quality": 0.8,  // Seçenek kalitesi
    "answer_correctness": 0.95,  // Cevap doğruluğu
    "educational_value": 0.9,  // Eğitsel değer
    "reusability": 0.85,  // Tekrar kullanılabilirlik
    "test_readiness": 0.9  // Test hazırlığı
  }}
}}"""
```

#### 6.4. Bloom Seviyesi Rastgele Dağıtım Algoritması

```python
import random

def distribute_bloom_levels(
    total_questions: int,
    bloom_levels: List[str] = None
) -> Dict[str, int]:
    """
    Bloom seviyelerini rastgele dağıtır.
    
    Args:
        total_questions: Toplam soru sayısı
        bloom_levels: Kullanılacak Bloom seviyeleri (None ise tümü)
    
    Returns:
        Her Bloom seviyesi için soru sayısı
    """
    if bloom_levels is None:
        bloom_levels = ["remember", "understand", "apply", "analyze", "evaluate", "create"]
    
    # Bloom seviyelerine ağırlık ver (düşük seviyeler daha fazla)
    weights = {
        "remember": 0.25,      # 25%
        "understand": 0.25,    # 25%
        "apply": 0.20,          # 20%
        "analyze": 0.15,        # 15%
        "evaluate": 0.10,       # 10%
        "create": 0.05          # 5%
    }
    
    # Normalize weights for selected levels
    selected_weights = {level: weights.get(level, 0.1) for level in bloom_levels}
    total_weight = sum(selected_weights.values())
    normalized_weights = {k: v/total_weight for k, v in selected_weights.items()}
    
    # Distribute questions
    distribution = {}
    remaining = total_questions
    
    for level in bloom_levels[:-1]:  # All except last
        count = int(total_questions * normalized_weights[level])
        distribution[level] = count
        remaining -= count
    
    # Last level gets remaining
    distribution[bloom_levels[-1]] = remaining
    
    return distribution
```

### 7. Teknik Detaylar

#### 7.1. Chunk İlişkilendirme

Soru üretilirken chunk'lar şu şekilde ilişkilendirilir:

1. **Konuya Bağlı Chunk'lar:**
   - `course_topics.related_chunk_ids` alanından alınır
   - Eğer yoksa, topic keywords'leri ile chunk içerikleri eşleştirilir

2. **Soru Üretiminde Kullanılan Chunk'lar:**
   - LLM prompt'una gönderilen chunk'lar
   - Bu chunk'lar `related_chunk_ids` olarak kaydedilir

3. **Source Chunks Cache:**
   - Chunk metadata'ları (document_name, chunk_index, chunk_text) cache'lenir
   - Export'ta tam bilgi sağlanır

#### 7.2. Bloom Seviyesi Belirleme

1. **Rastgele Dağıtım:** Bloom seviyeleri rastgele dağıtılır (ağırlıklı)
2. **Kullanıcı Seçimi:** Kullanıcı belirli Bloom seviyelerini seçebilir
3. **Otomatik Ağırlıklandırma:** 
   - Remember: 25%
   - Understand: 25%
   - Apply: 20%
   - Analyze: 15%
   - Evaluate: 10%
   - Create: 5%

#### 7.3. Ücretsiz Model Kullanımı

Sistem ücretsiz modelleri kullanır:
- **Ollama** (yerel): Tamamen ücretsiz, gizlilik odaklı
- **OpenRouter Free Tier**: `meta-llama/llama-3.1-8b-instruct:free`
- **Groq** (sınırlı ücretsiz tier): `llama-3.1-8b-instant`

Model seçimi:
1. Önce Ollama kontrol edilir (varsa)
2. Sonra OpenRouter free tier
3. Son olarak Groq (eğer API key varsa)

#### 7.4. Özel Prompt Birleştirme Mantığı

```python
def build_question_generation_prompt(
    bloom_level: str,
    topic_title: str,
    chunks_text: str,
    keywords: List[str],
    custom_prompt: str = None,
    prompt_instructions: str = None,
    use_default_prompts: bool = True
) -> str:
    """
    Soru üretim promptunu oluşturur.
    
    Eğer use_default_prompts = True:
        - Bloom seviyesine özel prompt (REMEMBER_PROMPT, UNDERSTAND_PROMPT, vb.)
        - + custom_prompt (varsa)
        - + prompt_instructions (varsa)
    
    Eğer use_default_prompts = False:
        - Sadece custom_prompt
        - + prompt_instructions (varsa)
        - Bloom seviyesi bilgisi eklenir (opsiyonel)
    """
    if use_default_prompts:
        # Bloom seviyesine özel prompt al
        base_prompt = get_bloom_prompt(bloom_level)
        
        # Özel prompt ekle (varsa)
        if custom_prompt:
            base_prompt += f"\n\nÖZEL TALİMATLAR:\n{custom_prompt}"
        
        # Ek talimatlar ekle (varsa)
        if prompt_instructions:
            base_prompt += f"\n\nEK TALİMATLAR:\n{prompt_instructions}"
    else:
        # Sadece özel prompt kullan
        if not custom_prompt:
            raise ValueError("use_default_prompts=False ise custom_prompt zorunludur")
        
        base_prompt = f"""Sen bir eğitim uzmanısın. Aşağıdaki ders materyali bağlamında "{topic_title}" konusu için sorular üret.

KONU BAŞLIĞI: {topic_title}
ANAHTAR KELİMELER: {', '.join(keywords)}
BLOOM SEVİYESİ: {bloom_level.upper()}

DERS MATERYALİ:
{chunks_text}

ÖZEL TALİMATLAR:
{custom_prompt}"""
        
        if prompt_instructions:
            base_prompt += f"\n\nEK TALİMATLAR:\n{prompt_instructions}"
        
        # JSON format talimatı ekle
        base_prompt += "\n\nÇIKTI FORMATI (JSON - SADECE JSON, BAŞKA METİN YOK):\n{\n  \"questions\": [\n    {\n      \"question\": \"...\",\n      \"options\": {\"A\": \"...\", \"B\": \"...\", \"C\": \"...\", \"D\": \"...\"},\n      \"correct_answer\": \"A\",\n      \"explanation\": \"...\",\n      \"bloom_level\": \"" + bloom_level + "\"\n    }\n  ]\n}"
    
    return base_prompt
```

#### 7.5. Özel Konu İşleme

```python
def handle_custom_topic(
    session_id: str,
    custom_topic: str,
    chunks: List[Dict]
) -> Dict:
    """
    Özel konu için chunk'ları filtreler ve topic bilgisi oluşturur.
    
    Eğer custom_topic belirtilmişse:
    1. Session'daki tüm chunk'ları al
    2. Chunk içeriklerinde custom_topic ile ilgili olanları bul (keyword matching veya embedding similarity)
    3. İlgili chunk'ları kullan
    4. Topic bilgisi oluştur (topic_id = NULL, topic_title = custom_topic)
    """
    if not custom_topic:
        return None
    
    # Chunk'ları custom_topic ile eşleştir
    # Basit keyword matching veya embedding similarity kullanılabilir
    relevant_chunks = filter_chunks_by_topic(chunks, custom_topic)
    
    return {
        "topic_id": None,
        "topic_title": custom_topic,
        "related_chunk_ids": [chunk.get("chunk_id") for chunk in relevant_chunks],
        "chunks": relevant_chunks
    }
```

#### 7.6. LLM Kalite Kontrolü İş Akışı

```
1. Soru üretilir (Bloom seviyesine özel prompt + özel prompt ile)
2. Kalite kontrolü aktifse:
   a. Kalite değerlendirme promptu hazırlanır
   b. LLM'e gönderilir (aynı veya farklı model)
   c. Response parse edilir:
      - quality_score (0-1)
      - usability_score (0-1)
      - is_approved (boolean)
      - evaluation (detaylı değerlendirme)
   d. Eğer quality_score >= quality_threshold:
      - Soru onaylanır (is_approved_by_llm = TRUE)
      - question_pool'a kaydedilir
   e. Değilse:
      - Soru reddedilir
      - questions_rejected_by_quality++
3. Progress güncellenir
```

#### 6.3. Batch İş Optimizasyonu

- **Rate Limiting:** LLM API rate limit'lerini aşmamak için
- **Retry Logic:** Başarısız soru üretimlerini tekrar dene
- **Progress Tracking:** Her 10 soruda bir progress güncelle
- **Error Handling:** Bir konu başarısız olsa bile diğerlerine devam et

### 7. Güvenlik ve Validasyon

1. **Access Control:**
   - Sadece session sahibi veya admin soru üretebilir
   - Batch işler için özel izin gerekebilir

2. **Soru Validasyonu:**
   - JSON format kontrolü
   - Gerekli alanların varlığı
   - Chunk ID'lerinin geçerliliği

3. **Rate Limiting:**
   - Kullanıcı başına günlük soru üretim limiti
   - Batch işler için özel limit

### 8. Gelecek Geliştirmeler

1. **Otomatik Soru Kalite Kontrolü:**
   - LLM ile soru kalitesi değerlendirmesi
   - Benzer soru tespiti (duplicate detection)

2. **Adaptif Soru Üretimi:**
   - Öğrenci performansına göre soru zorluğu ayarlama
   - Eksik konulara odaklanma

3. **Soru Önerileri:**
   - Öğrenci seviyesine uygun soru önerileri
   - Konu bazlı soru önerileri

4. **Analitik Dashboard:**
   - Soru kullanım istatistikleri
   - En çok kullanılan sorular
   - Zorluk seviyesi dağılımı

## Sonuç

Bu tasarım, mevcut sistem üzerine entegre edilebilir ve kullanıcıların kolayca soru havuzu oluşturmasını sağlar. JSON export özelliği ile test sistemlerine kolayca entegre edilebilir.

