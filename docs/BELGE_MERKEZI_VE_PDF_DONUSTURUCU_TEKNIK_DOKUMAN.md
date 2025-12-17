# Belge Merkezi ve PDF Markdown Dönüştürücü - Teknik Dokümantasyon

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Belge Merkezi Sayfası](#belge-merkezi-sayfası)
3. [PDF Markdown Dönüştürücü](#pdf-markdown-dönüştürücü)
4. [Mimari ve Akış](#mimari-ve-akış)
5. [API Endpoint'leri](#api-endpointleri)
6. [Veritabanı Yapısı](#veritabanı-yapısı)
7. [Kullanım Senaryoları](#kullanım-senaryoları)
8. [Teknik Detaylar](#teknik-detaylar)

---

## 🎯 Genel Bakış

Belge Merkezi, EBARS sisteminde PDF ve diğer belge formatlarını Markdown formatına dönüştürmek, kategorize etmek ve yönetmek için tasarlanmış kapsamlı bir modüldür. Sistem, öğretmenlerin eğitim materyallerini yükleyip, otomatik olarak işleyip, RAG (Retrieval-Augmented Generation) sisteminde kullanıma hazır hale getirmelerini sağlar.

### Temel Özellikler

- ✅ PDF, DOCX, PPTX, XLSX formatlarını Markdown'a dönüştürme
- ✅ Markdown dosyalarını kategorize etme ve yönetme
- ✅ Dosya görüntüleme, indirme ve silme işlemleri
- ✅ Toplu dosya işlemleri (kategori atama, silme)
- ✅ Gerçek zamanlı dönüştürme durumu takibi
- ✅ Fallback mekanizmaları ile güvenilir işleme

---

## 📄 Belge Merkezi Sayfası

### Konum ve Erişim

**Frontend Yolu:** `frontend/app/document-center/page.tsx`  
**URL:** `/document-center`  
**Erişim:** Sadece öğretmenler (teacher role)

### Bileşenler

#### 1. Ana Sayfa Bileşeni (`DocumentCenterPage`)

```12:22:frontend/app/document-center/page.tsx
import { useDocumentCenter } from "@/hooks/useDocumentCenter";
import { FilterBar } from "@/components/DocumentCenter/FilterBar";
import { FileList } from "@/components/DocumentCenter/FileList";
import { UploadSection } from "@/components/DocumentCenter/UploadSection";
import { CategoryManager } from "@/components/DocumentCenter/CategoryManager";
import Modal from "@/components/Modal";
import MarkdownViewer from "@/components/MarkdownViewer";
import EnhancedDocumentUploadModal from "@/components/EnhancedDocumentUploadModal";
import TeacherLayout from "@/app/components/TeacherLayout";

// Types
interface Category {
```

**Özellikler:**
- Öğretmen yetkisi kontrolü
- State yönetimi için `useDocumentCenter` hook'u kullanımı
- Modal yönetimi (yükleme, görüntüleme, kategori yönetimi)
- Başarı/hata mesajları gösterimi

#### 2. Custom Hook: `useDocumentCenter`

**Dosya:** `frontend/hooks/useDocumentCenter.ts`

Bu hook, belge merkezinin tüm state yönetimini ve iş mantığını kapsar:

**State Yönetimi:**
- Markdown dosyaları listesi ve filtreleme
- Kategori yönetimi
- Seçili dosyalar
- Pagination (sayfa başına 20 dosya)
- Loading ve error state'leri
- Modal state'leri

**Ana Fonksiyonlar:**

```72:90:frontend/hooks/useDocumentCenter.ts
  const fetchMarkdownFiles = async () => {
    try {
      setMarkdownLoading(true);
      setError(null);

      const [files, cats] = await Promise.all([
        listMarkdownFilesWithCategories(selectedCategoryId || undefined),
        listMarkdownCategories(),
      ]);

      setMarkdownFiles(files);
      setFilteredMarkdownFiles(files);
      setCategories(cats);
    } catch (e: any) {
      setError(e.message || "Markdown dosyaları yüklenemedi");
    } finally {
      setMarkdownLoading(false);
    }
  };
```

**Kategori İşlemleri:**
- `handleCreateCategory`: Yeni kategori oluşturma
- `handleDeleteCategory`: Kategori silme
- `handleAssignCategory`: Dosyalara kategori atama
- `handleCategoryFilter`: Kategoriye göre filtreleme

**Dosya İşlemleri:**
- `handleViewMarkdownFile`: Dosya içeriğini görüntüleme
- `handleDownloadMarkdownFile`: Dosya indirme
- `handleDeleteFile`: Tek dosya silme
- `handleDeleteSelectedFiles`: Seçili dosyaları silme
- `handleDeleteAllFiles`: Tüm dosyaları silme

#### 3. Upload Section

**Dosya:** `frontend/components/DocumentCenter/UploadSection.tsx`

Kullanıcıya PDF yükleme arayüzü sağlar:

```40:79:frontend/components/DocumentCenter/UploadSection.tsx
export function UploadSection({ onOpenUploadModal }: UploadSectionProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-6 mb-6 md:mb-0">
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <DocumentIcon />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-2">
              PDF'den Markdown'a Dönüştür
            </h3>
            <p className="text-blue-100">
              PDF dosyalarını otomatik olarak Markdown formatına dönüştürün ve
              kategorize edin
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center gap-3 min-w-[200px] justify-center"
            >
              <UploadIcon />
              <span>PDF Yükle</span>
            </button>
          )}

          <div className="text-center">
            <p className="text-xs text-blue-200">
              PDF dosyalarını Markdown'a dönüştürür
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 4. Enhanced Document Upload Modal

**Dosya:** `frontend/components/EnhancedDocumentUploadModal.tsx`

İki mod destekler:
- **Convert Mode**: PDF/DOCX/PPTX/XLSX → Markdown dönüştürme
- **Direct Mode**: Doğrudan Markdown dosyası yükleme

**Özellikler:**
- Drag & drop desteği
- İşlem adımları gösterimi
- Progress tracking
- Hata yönetimi

---

## 🔄 PDF Markdown Dönüştürücü

### Mimari

Sistem, iki farklı servis kullanarak PDF'leri Markdown'a dönüştürür:

1. **PDF Processing Service** (Marker tabanlı)
2. **DocStrange Service** (Nanonets + pdfplumber)

### 1. PDF Processing Service

**Dosya:** `services/pdf_processing_service/main.py`  
**Port:** 8080 (varsayılan)  
**Teknoloji:** Marker kütüphanesi + PyPDF2 fallback

#### Özellikler

- **Marker Kütüphanesi**: Yüksek kaliteli PDF → Markdown dönüştürme
- **PyPDF2 Fallback**: Marker başarısız olursa otomatik fallback
- **Async Model Loading**: Servis başlarken modelleri arka planda yükleme
- **Model Caching**: Model cache manager ile performans optimizasyonu

#### Ana Endpoint

```402:519:services/pdf_processing_service/main.py
@app.post("/process", response_model=PDFProcessingResponse)
async def process_pdf_endpoint(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Process PDF file and convert to Markdown with comprehensive error handling
    and MD saving failure checks
    """
    global processor_instance
    
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are supported.")
    
    # Validate file size before processing
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    max_size = 50 * 1024 * 1024  # 50MB
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {max_size // (1024*1024)}MB.")
    
    tmp_path = None
    md_content = None
    processing_metadata = None
    
    try:
        # Save uploaded file to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name
        
        logging.info(f"📄 Processing PDF: {file.filename} ({file_size / (1024*1024):.2f}MB)")
        
        # Process the PDF
        if processor_instance and processor_instance.models_loaded:
            logging.info("🔄 Using Marker processor")
            md_content, processing_metadata = processor_instance.process(tmp_path)
        else:
            logging.info("🔄 Using PyPDF2 fallback processor")
            md_content, processing_metadata = fallback_pdf_extract(tmp_path)
        
        # Validate MD content was generated
        if not md_content or not md_content.strip():
            logging.error("❌ MD content generation failed - empty result")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate markdown content from PDF. The file may be corrupted or contain only images."
            )
        
        # Validate MD content quality
        md_length = len(md_content.strip())
        if md_length < 50:  # Very short content might indicate processing failure
            logging.warning(f"⚠️ Generated MD content is very short ({md_length} characters)")
            
        logging.info(f"✅ MD generation successful: {md_length} characters")
        
        # Enhanced metadata for frontend
        processing_metadata.update({
            "original_filename": file.filename,
            "file_size_bytes": file_size,
            "md_generation_successful": True,
            "md_length": md_length,
            "processing_timestamp": datetime.now().isoformat(),
            "service_version": "1.0.0"
        })
        
        # Create response
        response = PDFProcessingResponse(content=md_content, metadata=processing_metadata)
        
        # Optional: Save MD to persistent storage for frontend retrieval
        if background_tasks:
            background_tasks.add_task(
                save_md_for_frontend_access,
                file.filename,
                md_content,
                processing_metadata
            )
        
        return response
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logging.error(f"❌ Unexpected error during PDF processing: {e}")
        logging.error(f"📋 Error details: {traceback.format_exc()}")
        
        # Return detailed error for debugging
        error_metadata = {
            "error": True,
            "error_message": str(e),
            "error_type": type(e).__name__,
            "original_filename": file.filename if file.filename else "unknown",
            "file_size_bytes": file_size,
            "processing_timestamp": datetime.now().isoformat(),
            "md_generation_successful": False
        }
        
        raise HTTPException(
            status_code=500,
            detail={
                "message": "PDF processing failed",
                "error": str(e),
                "metadata": error_metadata
            }
        )
    
    finally:
        # Always clean up the temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                logging.debug(f"🗑️ Cleaned up temporary file: {tmp_path}")
            except Exception as e:
                logging.warning(f"⚠️ Could not clean up temporary file: {e}")
```

#### Marker Processor

```234:346:services/pdf_processing_service/main.py
class MarkerProcessor:
    def __init__(self):
        self.converter = None
        self.models_loaded = False
        self.cache_manager = None
        self.load_start_time = None
        if MARKER_AVAILABLE:
            self._load_converter()

    def _load_converter(self):
        """Load converter with comprehensive error handling and timeout"""
        if self.models_loaded:
            return
        
        self.load_start_time = time.time()
        
        try:
            if CACHE_MANAGER_AVAILABLE:
                logging.info("🔄 Loading Marker models using cache manager...")
                self.cache_manager = get_model_cache_manager()
                
                # Always try to get cached models first
                artifact_dict = get_cached_marker_models(force_download=False)
                
                if artifact_dict:
                    logging.info("✅ Using cached/restored Marker models")
                else:
                    # Cache manager handles download and caching internally
                    logging.error("❌ Cache manager failed to provide models")
                    # Fallback to direct loading only as last resort
                    logging.info("🔄 Attempting direct model loading as fallback...")
                    from marker.models import create_model_dict
                    artifact_dict = create_model_dict()
            else:
                logging.info("🔄 Loading Marker models directly (no cache manager)...")
                from marker.models import create_model_dict
                artifact_dict = create_model_dict()
            
            if not artifact_dict:
                raise Exception("Model dictionary is empty or None")
            
            logging.info(f"📊 Model dictionary contains {len(artifact_dict)} components")
            
            self.converter = PdfConverter(artifact_dict=artifact_dict)
            self.models_loaded = True
            
            load_time = time.time() - self.load_start_time
            logging.info(f"✅ Marker models loaded successfully in {load_time:.1f}s!")
            
            if CACHE_MANAGER_AVAILABLE and self.cache_manager:
                stats = self.cache_manager.get_cache_stats()
                logging.info(f"📊 Cache stats: {stats['total_cache_size_mb']:.1f}MB cached, {stats['cached_model_sets']} model sets")
            
        except Exception as e:
            load_time = time.time() - self.load_start_time if self.load_start_time else 0
            logging.error(f"❌ Failed to load Marker models after {load_time:.1f}s: {e}")
            logging.error(f"📋 Error details: {traceback.format_exc()}")
            self.models_loaded = False

    def process(self, pdf_path: str) -> Tuple[str, Dict[str, Any]]:
        """Process PDF with Marker with comprehensive error handling and fallbacks"""
        if not self.models_loaded or not self.converter:
            logging.warning("🔄 Marker not ready, using fallback")
            return fallback_pdf_extract(pdf_path)

        start_time = time.time()
        try:
            # Validate file before processing
            if not os.path.exists(pdf_path):
                raise ValueError(f"PDF file not found: {pdf_path}")
            
            file_size = os.path.getsize(pdf_path)
            if file_size == 0:
                raise ValueError("PDF file is empty")
            
            logging.info(f"🔄 Processing with Marker: {os.path.basename(pdf_path)} ({file_size / (1024*1024):.1f}MB)")
            
            # Process with timeout
            rendered = self.converter(pdf_path)
            
            if not rendered:
                raise ValueError("Marker returned empty result")
            
            markdown_text, _, _ = text_from_rendered(rendered)
            
            if not markdown_text or not markdown_text.strip():
                logging.warning("⚠️ Marker produced empty text, falling back to PyPDF2")
                return fallback_pdf_extract(pdf_path)
            
            page_count = len(rendered.children) if hasattr(rendered, 'children') else 0
            processing_time = time.time() - start_time

            metadata = {
                "source_file": os.path.basename(pdf_path),
                "processing_method": "marker",
                "text_length": len(markdown_text),
                "page_count": page_count,
                "file_size_mb": file_size / (1024 * 1024),
                "processing_time_seconds": processing_time,
                "processing_timestamp": datetime.now().isoformat()
            }
            
            logging.info(f"✅ Marker processing completed in {processing_time:.1f}s: {len(markdown_text)} chars from {page_count} pages")
            return markdown_text, metadata
            
        except Exception as e:
            processing_time = time.time() - start_time
            logging.error(f"❌ Marker processing failed after {processing_time:.1f}s: {e}")
            logging.error(f"📋 Error details: {traceback.format_exc()}")
            logging.info("🔄 Falling back to PyPDF2 due to Marker error")
            return fallback_pdf_extract(pdf_path)
```

#### Health Check Endpoints

```347:400:services/pdf_processing_service/main.py
@app.get("/health")
async def health_check():
    """Basic health check - service is alive"""
    return {
        "status": "ok",
        "service": "pdf-processing",
        "timestamp": datetime.now().isoformat(),
        "marker_available": MARKER_AVAILABLE
    }

@app.get("/health/ready")
async def readiness_check():
    """Readiness check - service is ready to process requests"""
    global processor_instance
    
    is_ready = service_ready.is_set()
    models_still_loading = models_loading.is_set()
    
    status = {
        "status": "ready" if is_ready else "not_ready",
        "service": "pdf-processing",
        "timestamp": datetime.now().isoformat(),
        "details": {
            "marker_available": MARKER_AVAILABLE,
            "models_loaded": processor_instance.models_loaded if processor_instance else False,
            "models_loading": models_still_loading,
            "cache_manager_available": CACHE_MANAGER_AVAILABLE
        }
    }
    
    if not is_ready:
        return status, 503  # Service Unavailable
    
    return status

@app.get("/health/live")
async def liveness_check():
    """Liveness check - service is alive and functioning"""
    global processor_instance
    
    # Basic liveness - if we can respond, we're alive
    status = {
        "status": "alive",
        "service": "pdf-processing",
        "timestamp": datetime.now().isoformat(),
        "uptime_info": {
            "marker_available": MARKER_AVAILABLE,
            "processor_available": processor_instance is not None,
            "cache_available": CACHE_MANAGER_AVAILABLE
        }
    }
    
    return status
```

### 2. DocStrange Service

**Dosya:** `services/docstrange_service/main.py`  
**Port:** 8005 (varsayılan)  
**Teknoloji:** Nanonets API + pdfplumber fallback

#### Özellikler

- **Nanonets API**: OCR ve gelişmiş PDF işleme için harici API
- **pdfplumber Fallback**: Nanonets başarısız olursa veya zaman aşımına uğrarsa otomatik fallback
- **Timeout Yönetimi**: 30 saniye timeout ile hızlı fallback

#### Ana Endpoint

```61:181:services/docstrange_service/main.py
@app.post("/convert/pdf-to-markdown")
async def convert_pdf_to_markdown(
    file: UploadFile = File(...),
    use_fallback: str = Form(default="false")
):
    """
    Converts a PDF file to Markdown.
    First tries Nanonets API (for complex/scanned PDFs with good OCR).
    Falls back to pdfplumber (for simple text PDFs) if Nanonets fails or is too slow.
    
    Parameters:
    - file: PDF file to convert
    - use_fallback: "true" to skip Nanonets and use pdfplumber directly, "false" to try Nanonets first
    """
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDFs are accepted.")

    try:
        # Read file content once
        file_content = await file.read()
        markdown_content = None
        extraction_method = None
        use_fallback_bool = use_fallback.lower() == "true"
        
        # Option 1: Use pdfplumber directly if requested
        if use_fallback_bool:
            print("[DocStrange] Using pdfplumber (user requested)")
            markdown_content = extract_with_pdfplumber(file_content, file.filename)
            extraction_method = "pdfplumber"
        
        # Option 2: Try Nanonets first
        else:
            try:
                print(f"[DocStrange] 🌐 Trying Nanonets API for {file.filename}...")
                files_dict = {'file': (file.filename, file_content, file.content_type)}
                data = {'output_type': 'markdown'}
                headers = {'Authorization': f'Bearer {DOCSTRANGE_API_KEY}'}
                
                # Short timeout - if Nanonets is slow, use pdfplumber
                response = requests.post(
                    DOCSTRANGE_API_URL, 
                    headers=headers, 
                    files=files_dict, 
                    data=data, 
                    timeout=30  # 30 seconds max
                )
                
                if response.status_code == 200:
                    nanonets_response = response.json()
                    processing_status = nanonets_response.get('processing_status', 'completed')
                    
                    print(f"[DocStrange] Nanonets status: {processing_status}")
                    
                    # If async processing, use fallback immediately
                    if processing_status == 'processing':
                        print("[DocStrange] ⚠️ Nanonets returned async processing, using pdfplumber fallback")
                        markdown_content = extract_with_pdfplumber(file_content, file.filename)
                        extraction_method = "pdfplumber (Nanonets async)"
                    else:
                        # Try to extract content from Nanonets response
                        if 'content' in nanonets_response and nanonets_response['content']:
                            markdown_content = nanonets_response['content']
                            extraction_method = "nanonets"
                        elif 'data' in nanonets_response:
                            data_field = nanonets_response['data']
                            if isinstance(data_field, list) and len(data_field) > 0:
                                extracted = data_field[0]
                            else:
                                extracted = data_field
                            markdown_content = (
                                extracted.get('content', '') or
                                extracted.get('markdown', '') or 
                                extracted.get('text', '')
                            )
                            extraction_method = "nanonets"
                        
                        # If still no content, use fallback
                        if not markdown_content or not markdown_content.strip():
                            print("[DocStrange] ⚠️ Nanonets returned empty content, using pdfplumber fallback")
                            markdown_content = extract_with_pdfplumber(file_content, file.filename)
                            extraction_method = "pdfplumber (Nanonets empty)"
                else:
                    print(f"[DocStrange] ⚠️ Nanonets failed with status {response.status_code}, using pdfplumber fallback")
                    markdown_content = extract_with_pdfplumber(file_content, file.filename)
                    extraction_method = "pdfplumber (Nanonets error)"
                    
            except requests.Timeout:
                print("[DocStrange] ⏰ Nanonets timeout, using pdfplumber fallback")
                markdown_content = extract_with_pdfplumber(file_content, file.filename)
                extraction_method = "pdfplumber (Nanonets timeout)"
            except Exception as e:
                print(f"[DocStrange] ❌ Nanonets error: {e}, using pdfplumber fallback")
                markdown_content = extract_with_pdfplumber(file_content, file.filename)
                extraction_method = f"pdfplumber (Nanonets exception)"
        
        # Final check
        if not markdown_content or not markdown_content.strip():
            raise HTTPException(
                status_code=500,
                detail="Failed to extract any content from PDF using both Nanonets and pdfplumber"
            )
        
        # Return formatted response
        formatted_response = {
            "result": [
                {
                    "markdown": markdown_content.strip()
                }
            ],
            "extraction_method": extraction_method,
            "filename": file.filename
        }
        
        print(f"[DocStrange] ✅ Success with {extraction_method}")
        return JSONResponse(content=formatted_response)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DocStrange] ❌ Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
```

#### pdfplumber Fallback

```16:59:services/docstrange_service/main.py
def extract_with_pdfplumber(file_content: bytes, filename: str) -> str:
    """
    Fallback PDF extraction using pdfplumber
    Works for simple PDFs without complex layouts
    """
    try:
        print(f"[DocStrange] 📄 Using pdfplumber fallback for {filename}...")
        markdown_content = f"# {filename}\n\n"
        
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            total_pages = len(pdf.pages)
            print(f"[DocStrange] Total pages: {total_pages}")
            
            for page_num, page in enumerate(pdf.pages, 1):
                # Extract text
                text = page.extract_text()
                if text and text.strip():
                    markdown_content += f"\n\n## Sayfa {page_num}\n\n{text.strip()}"
                
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    for table_idx, table in enumerate(tables, 1):
                        markdown_content += f"\n\n### Tablo {table_idx}\n\n"
                        # Convert table to markdown
                        if table:
                            # Header row
                            if len(table) > 0:
                                markdown_content += "| " + " | ".join(str(cell or "") for cell in table[0]) + " |\n"
                                markdown_content += "|" + "|".join(["---" for _ in table[0]]) + "|\n"
                            # Data rows
                            for row in table[1:]:
                                markdown_content += "| " + " | ".join(str(cell or "") for cell in row) + " |\n"
                        markdown_content += "\n"
                
                if page_num % 5 == 0:
                    print(f"[DocStrange] Processed {page_num}/{total_pages} pages")
        
        print(f"[DocStrange] ✅ pdfplumber extracted {len(markdown_content)} chars from {total_pages} pages")
        return markdown_content.strip()
        
    except Exception as e:
        print(f"[DocStrange] ❌ pdfplumber failed: {e}")
        raise HTTPException(status_code=500, detail=f"pdfplumber extraction failed: {e}")
```

---

## 🏗️ Mimari ve Akış

### Dönüştürme Akışı

```
┌─────────────────┐
│   Frontend      │
│  (Upload Modal) │
└────────┬────────┘
         │
         │ POST /documents/convert-document-to-markdown
         ▼
┌─────────────────┐
│  API Gateway    │
│  (main.py)      │
└────────┬────────┘
         │
         │ Route to PDF Processor
         ▼
┌─────────────────┐      ┌──────────────────┐
│ PDF Processing  │  OR  │  DocStrange      │
│ Service         │      │  Service         │
│ (Marker)        │      │ (Nanonets/plumber)│
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │ Markdown Content       │
         ▼                        ▼
┌─────────────────────────────────────┐
│   Cloud Storage Manager             │
│   (save_markdown_file)              │
└────────┬────────────────────────────┘
         │
         │ Save to data/markdown/
         ▼
┌─────────────────┐
│  Markdown File  │
│  (Ready for RAG) │
└─────────────────┘
```

### API Gateway Routing

```906:1002:src/api/main.py
@app.post("/api/documents/convert-document-to-markdown", response_model=PDFToMarkdownResponse)
@app.post("/documents/convert-document-to-markdown", response_model=PDFToMarkdownResponse)
async def convert_document_to_markdown(file: UploadFile = File(...)):
    """Convert document to markdown - Route to PDF Processing Service"""
    supported_extensions = ['.pdf', '.docx', '.pptx', '.xlsx']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in supported_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {', '.join(supported_extensions)}"
        )
    
    try:
        # Read uploaded file content
        content = await file.read()
        
        # Route to PDF Processing Service
        files = {'file': (file.filename, content, file.content_type)}
        
        response = requests.post(
            f"{PDF_PROCESSOR_URL}/convert/pdf-to-markdown",
            files=files,
            timeout=600  # 10 minutes for large PDF processing (includes DocStrange polling)
        )
        
        if response.status_code != 200:
            error_detail = f"PDF processor service error: {response.status_code}"
            if response.text:
                try:
                    error_json = response.json()
                    error_detail = error_json.get('detail', error_detail)
                except:
                    error_detail = f"{error_detail} - {response.text[:200]}"
                    
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Parse response from PDF processor (DocStrange format)
        processor_result = response.json()
        
        # Handle DocStrange response format
        markdown_content = None
        if 'result' in processor_result and isinstance(processor_result['result'], list):
            full_text = ""
            for item in processor_result['result']:
                if 'markdown' in item:
                    full_text += item['markdown'] + "\n\n"
            markdown_content = full_text.strip()
        elif 'content' in processor_result:
            markdown_content = processor_result['content']
        elif 'markdown' in processor_result:
            markdown_content = processor_result['markdown']
        else:
            raise HTTPException(status_code=500, detail="Invalid response format from PDF processor")
        
        if not markdown_content or not markdown_content.strip():
            raise HTTPException(status_code=500, detail="PDF processor returned empty markdown content")
        
        # Generate markdown filename (remove original extension, add .md)
        base_filename = Path(file.filename).stem
        # Sanitize filename
        safe_base = "".join(c for c in base_filename if c.isalnum() or c in (' ', '-', '_')).strip()
        markdown_filename = f"{safe_base}.md"
        
        # Save markdown file using cloud storage manager
        success = cloud_storage_manager.save_markdown_file(markdown_filename, markdown_content)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save markdown file")
        
        return PDFToMarkdownResponse(
            success=True,
            message=f"Document converted to markdown successfully",
            markdown_filename=markdown_filename,
            content=markdown_content[:500] + "..." if len(markdown_content) > 500 else markdown_content
        )
```

---

## 🔌 API Endpoint'leri

### Frontend API Fonksiyonları

**Dosya:** `frontend/lib/api.ts`

#### convertPdfToMarkdown

```1208:1244:frontend/lib/api.ts
export async function convertPdfToMarkdown(
  file: File,
  useFallback: boolean = false
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("use_fallback", useFallback ? "true" : "false");

  // Shorter timeout for fallback (pdfplumber is faster)
  const timeout = useFallback ? 120000 : 600000; // 2 min for pdfplumber, 10 min for Nanonets
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(
      `${getApiUrl()}/documents/convert-document-to-markdown`,
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(
        "PDF dönüştürme işlemi zaman aşımına uğradı. Lütfen daha küçük bir dosya deneyin veya hızlı işlemi seçin."
      );
    }
    throw error;
  }
}
```

### Backend API Endpoint'leri

#### Markdown Dosya Yönetimi

- `GET /api/markdown-files/with-categories` - Kategorilerle birlikte markdown dosyalarını listele
- `GET /api/documents/markdown/{filename}` - Markdown dosya içeriğini getir
- `DELETE /api/documents/markdown/{filename}` - Markdown dosyasını sil
- `POST /api/documents/markdown/upload` - Doğrudan markdown dosyası yükle

#### Kategori Yönetimi

- `GET /api/markdown-categories` - Kategorileri listele
- `POST /api/markdown-categories` - Yeni kategori oluştur
- `PUT /api/markdown-categories/{category_id}` - Kategori güncelle
- `DELETE /api/markdown-categories/{category_id}` - Kategori sil
- `POST /api/markdown-files/assign-category` - Dosyalara kategori ata

---

## 🗄️ Veritabanı Yapısı

### Tablolar

#### markdown_categories

```sql
CREATE TABLE markdown_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### markdown_file_categories

```sql
CREATE TABLE markdown_file_categories (
    filename TEXT PRIMARY KEY,
    category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES markdown_categories(id) ON DELETE SET NULL
);
```

### İlişkiler

- Bir markdown dosyası bir kategoriye ait olabilir (opsiyonel)
- Kategori silindiğinde, dosyalar kategorisiz kalır (ON DELETE SET NULL)

---

## 📖 Kullanım Senaryoları

### Senaryo 1: PDF Yükleme ve Dönüştürme

1. Öğretmen `/document-center` sayfasına gider
2. "PDF Yükle" butonuna tıklar
3. PDF dosyasını seçer veya sürükleyip bırakır
4. Sistem PDF'i işler:
   - Marker servisi ile yüksek kaliteli dönüştürme denenir
   - Başarısız olursa PyPDF2 fallback kullanılır
5. Markdown dosyası `data/markdown/` dizinine kaydedilir
6. Dosya listesinde görünür

### Senaryo 2: Kategori Yönetimi

1. Öğretmen "Kategorileri Yönet" butonuna tıklar
2. Yeni kategori oluşturur (örn: "Matematik Ders Notları")
3. Dosyaları seçer ve kategoriye atar
4. Filtreleme ile kategoriye göre dosyaları görüntüler

### Senaryo 3: Toplu İşlemler

1. Öğretmen birden fazla dosya seçer
2. "Kategori Ata" dropdown'ından kategori seçer
3. Tüm seçili dosyalar kategoriye atanır
4. Veya "Seçilileri Sil" ile toplu silme yapılır

### Senaryo 4: Dosya Görüntüleme ve İndirme

1. Öğretmen dosya listesinde bir dosyaya tıklar
2. Modal açılır ve Markdown içeriği görüntülenir
3. "İndir" butonu ile dosya bilgisayara indirilir

---

## 🔧 Teknik Detaylar

### Dosya Depolama

Markdown dosyaları `data/markdown/` dizininde saklanır. Cloud Storage Manager (`src/storage/cloud_storage_manager.py`) bu dosyaları yönetir.

### Güvenlik

- Dosya adları sanitize edilir (özel karakterler temizlenir)
- Maksimum dosya boyutu: 50MB
- Sadece öğretmenler erişebilir (role kontrolü)

### Performans

- Pagination: Sayfa başına 20 dosya
- Async model loading: Marker modelleri arka planda yüklenir
- Caching: Model cache manager ile model yükleme süreleri optimize edilir
- Timeout yönetimi: Uzun süren işlemler için timeout mekanizması

### Hata Yönetimi

- Fallback mekanizmaları: Marker → PyPDF2, Nanonets → pdfplumber
- Detaylı hata mesajları: Kullanıcıya anlaşılır hata mesajları
- Logging: Tüm işlemler loglanır

### Environment Variables

**PDF Processing Service:**
- `MARKER_CACHE_DIR`: Model cache dizini
- `PORT`: Servis portu (varsayılan: 8080)
- `MODEL_LOAD_TIMEOUT`: Model yükleme timeout (varsayılan: 600 saniye)

**DocStrange Service:**
- `DOCSTRANGE_API_KEY`: Nanonets API anahtarı
- `PORT`: Servis portu (varsayılan: 8005)

---

## 📝 Özet

Belge Merkezi ve PDF Markdown Dönüştürücü, EBARS sisteminin kritik bir parçasıdır. Sistem:

- ✅ Çoklu dönüştürme servisi desteği (Marker, Nanonets, pdfplumber)
- ✅ Güvenilir fallback mekanizmaları
- ✅ Kapsamlı kategori yönetimi
- ✅ Kullanıcı dostu arayüz
- ✅ Ölçeklenebilir mimari

ile eğitim materyallerinin etkili bir şekilde yönetilmesini ve RAG sisteminde kullanılmasını sağlar.

---

**Son Güncelleme:** 2024  
**Versiyon:** 1.0.0  
**Yazar:** EBARS Development Team


















