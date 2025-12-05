-- Migration 018: Create Question Pool System Tables
-- Date: 2025-01-XX
-- Description: Create tables for question pool system with batch generation, quality control, and duplicate detection
-- Dependency: Migration 008 (Topic classification system)

-- ===========================================
-- 1. Create question_pool table
-- ===========================================

CREATE TABLE IF NOT EXISTS question_pool (
    question_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    topic_id INTEGER,  -- NULL olabilir (genel sorular için)
    topic_title TEXT,  -- Konu başlığı (cache için)
    
    -- Soru içeriği
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',  -- multiple_choice, open_ended, true_false
    difficulty_level TEXT DEFAULT 'intermediate',  -- beginner, intermediate, advanced (eski sistem uyumluluğu için)
    bloom_level TEXT,  -- remember, understand, apply, analyze, evaluate, create (Bloom Taksonomisi)
    
    -- Çoktan seçmeli sorular için
    options TEXT,  -- JSON: {"A": "seçenek1", "B": "seçenek2", ...}
    correct_answer TEXT,  -- "A", "B", "C", "D" veya açık uçlu için doğru cevap metni
    explanation TEXT,  -- Doğru cevabın açıklaması
    
    -- Chunk ilişkileri
    related_chunk_ids TEXT,  -- JSON array: ["chunk_id1", "chunk_id2", ...]
    source_chunks TEXT,  -- JSON: Chunk metadata'ları (cache için)
    
    -- Metadata
    generation_method TEXT DEFAULT 'llm_generated',  -- llm_generated, manual, synthetic
    generation_model TEXT,  -- Kullanılan model (örn: "llama-3.1-8b-instant")
    generation_prompt TEXT,  -- Kullanılan prompt (opsiyonel, debug için)
    confidence_score REAL DEFAULT 0.0,  -- Üretim güven skoru (0-1)
    
    -- Kalite Değerlendirmesi (LLM ile)
    quality_score REAL,  -- Soru kalitesi skoru (0-1)
    quality_evaluation TEXT,  -- JSON: LLM'in kalite değerlendirmesi
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
    validated_at TEXT,
    
    FOREIGN KEY (topic_id) REFERENCES course_topics(topic_id)
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_question_pool_session ON question_pool(session_id);
CREATE INDEX IF NOT EXISTS idx_question_pool_topic ON question_pool(topic_id);
CREATE INDEX IF NOT EXISTS idx_question_pool_difficulty ON question_pool(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_question_pool_bloom ON question_pool(bloom_level);
CREATE INDEX IF NOT EXISTS idx_question_pool_active ON question_pool(is_active);
CREATE INDEX IF NOT EXISTS idx_question_pool_featured ON question_pool(is_featured);
CREATE INDEX IF NOT EXISTS idx_question_pool_duplicate ON question_pool(is_duplicate);
CREATE INDEX IF NOT EXISTS idx_question_pool_created ON question_pool(created_at);

-- ===========================================
-- 2. Create question_pool_batch_jobs table
-- ===========================================

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
    
    -- Metadata
    created_by INTEGER,  -- user_id
    started_at TEXT,
    completed_at TEXT,
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_batch_jobs_session ON question_pool_batch_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON question_pool_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_created ON question_pool_batch_jobs(created_at);

-- ===========================================
-- 3. Create question_embeddings table (for duplicate detection optimization)
-- ===========================================

CREATE TABLE IF NOT EXISTS question_embeddings (
    question_id INTEGER PRIMARY KEY,
    embedding BLOB,  -- Vector embedding (numpy array serialized as bytes)
    embedding_model TEXT,  -- Hangi model kullanıldı (örn: "text-embedding-v4")
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES question_pool(question_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_question_embeddings_model ON question_embeddings(embedding_model);

-- ===========================================
-- 4. Create triggers for automatic updates
-- ===========================================

-- Update question_pool.updated_at on changes
CREATE TRIGGER IF NOT EXISTS update_question_pool_timestamp
AFTER UPDATE ON question_pool
BEGIN
    UPDATE question_pool 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE question_id = NEW.question_id;
END;

-- ===========================================
-- Migration complete
-- ===========================================

SELECT 'Migration 018 complete - Question pool system tables created' AS status;


