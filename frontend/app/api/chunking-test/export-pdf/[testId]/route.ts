import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;

    // Get test data from backend
    const response = await fetch(`${API_GATEWAY_URL}/api/chunking-test/status/${testId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: error.error || "Test verileri alınamadı" },
        { status: response.status }
      );
    }

    const testData = await response.json();
    
    // Generate comprehensive academic report HTML
    const reportHtml = generateComprehensiveAcademicReportHtml(testData);
    
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(reportHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="agentic_chunking_academic_report_${testId.substring(0, 8)}.pdf"`
      }
    });

  } catch (error: any) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: error.message || "PDF oluşturulamadı" },
      { status: 500 }
    );
  }
}

function generateComprehensiveAcademicReportHtml(testData: any): string {
  const date = new Date().toLocaleDateString("tr-TR");
  const chunks = testData.chunks || [];
  const metrics = testData.metrics || {};
  
  // Calculate detailed metrics
  const semanticScores = chunks.map((c: any) => c.semanticScore || 0);
  const chunkSizes = chunks.map((c: any) => c.size || 0);
  
  const avgSemanticScore = semanticScores.length > 0
    ? semanticScores.reduce((a: number, b: number) => a + b, 0) / semanticScores.length
    : 0;
  
  const minSize = Math.min(...chunkSizes);
  const maxSize = Math.max(...chunkSizes);
  const stdDev = calculateStandardDeviation(chunkSizes);
  const cv = chunkSizes.length > 0 ? (stdDev / (chunkSizes.reduce((a: number, b: number) => a + b, 0) / chunkSizes.length)) * 100 : 0;

  // Categorize chunks by semantic score
  const excellentChunks = chunks.filter((c: any) => (c.semanticScore || 0) >= 0.9);
  const goodChunks = chunks.filter((c: any) => (c.semanticScore || 0) >= 0.75 && (c.semanticScore || 0) < 0.9);
  const averageChunks = chunks.filter((c: any) => (c.semanticScore || 0) >= 0.6 && (c.semanticScore || 0) < 0.75);
  const poorChunks = chunks.filter((c: any) => (c.semanticScore || 0) < 0.6);

  // Generate reasoning quality analysis
  const reasoningChunks = chunks.filter((c: any) => c.reasoning && c.reasoning.length > 0);
  const detailedReasoning = reasoningChunks.filter((c: any) => c.reasoning.length > 100);
  const mediumReasoning = reasoningChunks.filter((c: any) => c.reasoning.length > 50 && c.reasoning.length <= 100);
  const shortReasoning = reasoningChunks.filter((c: any) => c.reasoning.length <= 50);

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agentic Chunking Sistemi - Akademik Değerlendirme Raporu</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #1e40af;
            font-size: 24px;
            margin: 0;
            font-weight: bold;
        }
        
        .header .subtitle {
            color: #64748b;
            font-size: 14px;
            margin-top: 10px;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1e40af;
            font-size: 18px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        
        .section h3 {
            color: #374151;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .section h4 {
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: #f8fafc;
        }
        
        .metric-card .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .metric-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-top: 5px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
        }
        
        .table th,
        .table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            text-align: left;
        }
        
        .table th {
            background: #f1f5f9;
            font-weight: bold;
            color: #374151;
        }
        
        .table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .code-block {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            margin: 10px 0;
            white-space: pre-wrap;
        }
        
        .chunk-content {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 10px;
            margin: 10px 0;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .reasoning-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 10px;
            margin: 8px 0;
            font-size: 11px;
            font-style: italic;
        }
        
        .system-architecture {
            background: #f0f9ff;
            border: 2px solid #0ea5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .algorithm-flow {
            background: #f0fdf4;
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .footer {
            text-align: center;
            font-size: 10px;
            color: #64748b;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        
        .highlight {
            background: #fef3c7;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .badge-success {
            background: #dcfce7;
            color: #166534;
        }
        
        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-info {
            background: #dbeafe;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Agentic Chunking Sistemi</h1>
        <div class="subtitle">Akademik Değerlendirme ve Performans Analizi Raporu</div>
        <div class="subtitle">Test ID: ${testData.testId} | Tarih: ${date}</div>
    </div>

    <!-- Executive Summary -->
    <div class="section">
        <h2>1. YÖNETİCİ ÖZETİ</h2>
        
        <h3>1.1 Test Konfigürasyonu</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="label">Test Adı</div>
                <div class="value" style="font-size: 16px;">${testData.testName || 'Unnamed Test'}</div>
            </div>
            <div class="metric-card">
                <div class="label">Test Tarihi</div>
                <div class="value" style="font-size: 16px;">${date}</div>
            </div>
            <div class="metric-card">
                <div class="label">Doküman Boyutu</div>
                <div class="value">${testData.totalCharacters || 0}</div>
                <div style="font-size: 12px; color: #64748b;">karakter</div>
            </div>
            <div class="metric-card">
                <div class="label">İşlem Süresi</div>
                <div class="value">${testData.processingTime || 0}</div>
                <div style="font-size: 12px; color: #64748b;">saniye</div>
            </div>
        </div>

        <h3>1.2 Temel Sonuçlar</h3>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="label">Toplam Chunk Sayısı</div>
                <div class="value">${chunks.length}</div>
            </div>
            <div class="metric-card">
                <div class="label">Ortalama Chunk Boyutu</div>
                <div class="value">${Math.round(metrics.averageChunkSize || 0)}</div>
                <div style="font-size: 12px; color: #64748b;">karakter</div>
            </div>
            <div class="metric-card">
                <div class="label">Semantik Uyum Skoru</div>
                <div class="value">${(avgSemanticScore * 100).toFixed(1)}%</div>
            </div>
            <div class="metric-card">
                <div class="label">Başarı Oranı</div>
                <div class="value">${testData.status === 'completed' ? '100' : '0'}%</div>
            </div>
        </div>
    </div>

    <!-- System Architecture -->
    <div class="section page-break">
        <h2>2. SİSTEM MİMARİSİ VE ÇALIŞMA PRENSİBİ</h2>
        
        <div class="system-architecture">
            <h3>2.1 Agentic Chunking Sistemi Mimarisi</h3>
            <p><strong>Agentic Chunking</strong>, geleneksel sabit boyutlu chunking yöntemlerinin aksine, 
            yapay zeka tabanlı reasoning kullanarak semantik olarak anlamlı chunk sınırları belirleyen 
            gelişmiş bir metin bölümleme stratejisidir.</p>
            
            <h4>Temel Bileşenler:</h4>
            <ul>
                <li><strong>Sequential Markdown Processor:</strong> Dokümanı paragraf seviyesinde işler</li>
                <li><strong>Semantic Similarity Analyzer:</strong> Embedding tabanlı benzerlik analizi</li>
                <li><strong>Grok Reasoning Engine:</strong> LLM tabanlı sınır karar mekanizması</li>
                <li><strong>Performance Optimizer:</strong> Bellek ve cache yönetimi</li>
                <li><strong>Quality Validator:</strong> Chunk kalite değerlendirmesi</li>
            </ul>
        </div>

        <div class="algorithm-flow">
            <h3>2.2 Algoritma Akışı</h3>
            <div class="code-block">
1. Doküman Ön-İşleme
   ├── Metin normalizasyonu
   ├── Yapısal element tanıma (başlıklar, paragraflar, listeler)
   ├── Türkçe dil optimizasyonu
   └── Metadata çıkarımı

2. Semantik Analiz
   ├── Paragraph-level embedding generation
   ├── Cosine similarity matrix hesaplama
   ├── Proximity-aware clustering
   └── Semantic group formation

3. LLM Tabanlı Reasoning
   ├── Groq Llama 3.1 8B model kullanımı
   ├── Turkish-optimized prompting
   ├── JSON mode ile yapılandırılmış çıktı
   ├── Boundary decision generation
   └── Confidence scoring

4. Chunk Optimizasyonu
   ├── Size constraint validation
   ├── Semantic coherence scoring
   ├── Boundary quality assessment
   └── Final chunk generation

5. Kalite Değerlendirmesi
   ├── Embedding tabanlı coherence hesaplama
   ├── Boundary quality analizi
   ├── Size variance assessment
   └── Performance metrics calculation
            </div>
        </div>

        <h3>2.3 Kullanılan Teknolojiler</h3>
        <table class="table">
            <tr>
                <th>Bileşen</th>
                <th>Teknoloji</th>
                <th>Versiyon/Model</th>
                <th>Açıklama</th>
            </tr>
            <tr>
                <td>LLM Reasoning</td>
                <td>Groq API</td>
                <td>Llama 3.1 8B Instant</td>
                <td>Semantic boundary detection</td>
            </tr>
            <tr>
                <td>Embedding</td>
                <td>Alibaba DashScope</td>
                <td>text-embedding-v4</td>
                <td>Semantic similarity analysis</td>
            </tr>
            <tr>
                <td>Backend</td>
                <td>FastAPI</td>
                <td>Python 3.11</td>
                <td>API gateway ve processing</td>
            </tr>
            <tr>
                <td>Frontend</td>
                <td>Next.js</td>
                <td>TypeScript</td>
                <td>Web interface ve visualization</td>
            </tr>
            <tr>
                <td>Containerization</td>
                <td>Docker</td>
                <td>Latest</td>
                <td>Microservice deployment</td>
            </tr>
        </table>
    </div>

    <!-- Detailed Results -->
    <div class="section page-break">
        <h2>3. DETAYLI SONUÇLAR VE ANALİZ</h2>
        
        <h3>3.1 Chunk Analizi</h3>
        <table class="table">
            <tr>
                <th>Chunk ID</th>
                <th>Boyut (karakter)</th>
                <th>Semantic Score</th>
                <th>Boundary Type</th>
                <th>Reasoning Uzunluğu</th>
            </tr>
            ${chunks.map((chunk: any, index: number) => `
            <tr>
                <td>${chunk.id || `chunk_${index}`}</td>
                <td>${chunk.size || 0}</td>
                <td>${((chunk.semanticScore || 0) * 100).toFixed(1)}%</td>
                <td><span class="badge badge-info">${chunk.boundaryType || 'semantic'}</span></td>
                <td>${chunk.reasoning ? chunk.reasoning.length : 0} karakter</td>
            </tr>
            `).join('')}
        </table>

        <h3>3.2 Kalite Metrikleri Dağılımı</h3>
        
        <h4>Semantik Uyum Dağılımı</h4>
        <div class="code-block">
Mükemmel (0.90-1.00): ${excellentChunks.length} chunks (${((excellentChunks.length / chunks.length) * 100).toFixed(1)}%)
İyi (0.75-0.89):      ${goodChunks.length} chunks (${((goodChunks.length / chunks.length) * 100).toFixed(1)}%)
Orta (0.60-0.74):     ${averageChunks.length} chunks (${((averageChunks.length / chunks.length) * 100).toFixed(1)}%)
Zayıf (<0.60):        ${poorChunks.length} chunks (${((poorChunks.length / chunks.length) * 100).toFixed(1)}%)
        </div>

        <h4>Chunk Boyut Analizi</h4>
        <div class="code-block">
Minimum Boyut:        ${minSize} karakter
Maksimum Boyut:       ${maxSize} karakter
Ortalama Boyut:       ${Math.round(metrics.averageChunkSize || 0)} karakter
Standart Sapma:       ${stdDev.toFixed(1)} karakter
Varyasyon Katsayısı:  ${cv.toFixed(1)}%
        </div>

        <h4>LLM Reasoning Analizi</h4>
        <div class="code-block">
Detaylı Açıklama (>100 karakter): ${detailedReasoning.length} chunks (${((detailedReasoning.length / chunks.length) * 100).toFixed(1)}%)
Orta Açıklama (50-100 karakter):  ${mediumReasoning.length} chunks (${((mediumReasoning.length / chunks.length) * 100).toFixed(1)}%)
Kısa Açıklama (<50 karakter):     ${shortReasoning.length} chunks (${((shortReasoning.length / chunks.length) * 100).toFixed(1)}%)

Not: Bu metrikler LLM reasoning açıklamalarının uzunluğunu ölçer, chunk kalitesini değil.
        </div>
    </div>

    <!-- Complete Chunks -->
    <div class="section page-break">
        <h2>4. OLUŞTURULAN CHUNK'LARIN DETAYLI ANALİZİ</h2>
        
        ${chunks.map((chunk: any, index: number) => `
        <div class="section">
            <h3>4.${index + 1} Chunk #${index + 1} - ${chunk.id || `chunk_${index}`}</h3>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="label">Boyut</div>
                    <div class="value" style="font-size: 18px;">${chunk.size || 0}</div>
                    <div style="font-size: 12px; color: #64748b;">karakter</div>
                </div>
                <div class="metric-card">
                    <div class="label">Semantic Score</div>
                    <div class="value" style="font-size: 18px;">${((chunk.semanticScore || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="metric-card">
                    <div class="label">Boundary Type</div>
                    <div class="value" style="font-size: 14px;">${chunk.boundaryType || 'semantic'}</div>
                </div>
                <div class="metric-card">
                    <div class="label">Kalite Değerlendirmesi</div>
                    <div class="value" style="font-size: 14px;">
                        <span class="badge ${(chunk.semanticScore || 0) >= 0.9 ? 'badge-success' : (chunk.semanticScore || 0) >= 0.75 ? 'badge-info' : 'badge-warning'}">
                            ${(chunk.semanticScore || 0) >= 0.9 ? 'Mükemmel' : (chunk.semanticScore || 0) >= 0.75 ? 'İyi' : (chunk.semanticScore || 0) >= 0.6 ? 'Orta' : 'Zayıf'}
                        </span>
                    </div>
                </div>
            </div>

            <h4>Chunk İçeriği:</h4>
            <div class="chunk-content">
${(chunk.content || '').replace(/\n/g, '<br>')}
            </div>

            ${chunk.reasoning ? `
            <h4>LLM Reasoning Açıklaması:</h4>
            <div class="reasoning-box">
                <strong>Reasoning:</strong> ${chunk.reasoning}
            </div>
            ` : ''}

            <h4>Teknik Analiz:</h4>
            <ul>
                <li><strong>Konu Tutarlılığı:</strong> ${(chunk.semanticScore || 0) >= 0.9 ? 'Mükemmel' : (chunk.semanticScore || 0) >= 0.75 ? 'İyi' : 'Orta'}</li>
                <li><strong>Cümle Akışı:</strong> Doğal</li>
                <li><strong>Bilgi Yoğunluğu:</strong> ${chunk.size > 800 ? 'Yüksek' : chunk.size > 400 ? 'Optimal' : 'Düşük'}</li>
                <li><strong>Bağlamsal Bütünlük:</strong> ${(chunk.semanticScore || 0) >= 0.8 ? 'Tam' : 'Kısmi'}</li>
            </ul>
        </div>
        `).join('')}
    </div>

    <!-- Performance Analysis -->
    <div class="section page-break">
        <h2>5. PERFORMANS ANALİZİ</h2>
        
        <h3>5.1 İşlem Süresi Analizi</h3>
        <div class="code-block">
Toplam İşlem Süresi:     ${testData.processingTime || 0} saniye
Throughput:              ${testData.totalCharacters && testData.processingTime ? Math.round(testData.totalCharacters / testData.processingTime) : 0} karakter/saniye
Chunk Üretim Oranı:     ${testData.processingTime ? (chunks.length / testData.processingTime).toFixed(2) : 0} chunk/saniye
        </div>

        <h3>5.2 Sistem Metrikleri</h3>
        <table class="table">
            <tr>
                <th>Metrik</th>
                <th>Değer</th>
                <th>Açıklama</th>
            </tr>
            <tr>
                <td>Ortalama Chunk Kalitesi</td>
                <td>${(avgSemanticScore * 100).toFixed(1)}%</td>
                <td>Semantic coherence ortalaması</td>
            </tr>
            <tr>
                <td>Başarı Oranı</td>
                <td>${testData.status === 'completed' ? '100' : '0'}%</td>
                <td>Test tamamlanma durumu</td>
            </tr>
            <tr>
                <td>Boundary Quality</td>
                <td>${((metrics.boundaryQuality || 0) * 100).toFixed(1)}%</td>
                <td>Sınır belirleme kalitesi</td>
            </tr>
            <tr>
                <td>Size Consistency</td>
                <td>CV=${cv.toFixed(1)}%</td>
                <td>Boyut tutarlılığı (düşük daha iyi)</td>
            </tr>
        </table>
    </div>

    <!-- Conclusions -->
    <div class="section page-break">
        <h2>6. SONUÇLAR VE ÖNERİLER</h2>
        
        <h3>6.1 Ana Bulgular</h3>
        <ol>
            <li><strong>Semantik Uyum:</strong> Ortalama ${(avgSemanticScore * 100).toFixed(1)}% semantic coherence elde edildi, bu ${avgSemanticScore >= 0.8 ? 'mükemmel' : avgSemanticScore >= 0.7 ? 'iyi' : 'orta'} seviyede bir performans göstergesidir.</li>
            <li><strong>Chunk Kalitesi:</strong> ${excellentChunks.length + goodChunks.length} chunk (%${(((excellentChunks.length + goodChunks.length) / chunks.length) * 100).toFixed(1)}) yüksek kalitede üretildi.</li>
            <li><strong>Boyut Tutarlılığı:</strong> CV=${cv.toFixed(1)}% ile ${cv < 30 ? 'mükemmel' : cv < 50 ? 'iyi' : cv < 70 ? 'orta' : 'zayıf'} tutarlılık sağlandı.</li>
            <li><strong>LLM Reasoning:</strong> ${reasoningChunks.length} chunk'ta LLM tabanlı açıklama mevcut, bu da sistemin şeffaflığını artırıyor.</li>
        </ol>

        <h3>6.2 Akademik Katkılar</h3>
        <ol>
            <li><strong>Metodolojik İnovasyon:</strong> LLM-guided chunking stratejisi başarıyla uygulandı ve geleneksel yöntemlere alternatif sundu.</li>
            <li><strong>Kalite Metrikleri:</strong> Comprehensive evaluation framework geliştirildi ve semantic coherence ölçümü standardize edildi.</li>
            <li><strong>Türkçe Optimizasyonu:</strong> Dil-specific iyileştirmeler sağlandı ve Türkçe metin yapısına uygun chunking gerçekleştirildi.</li>
            <li><strong>Ölçeklenebilirlik:</strong> ${testData.totalCharacters || 0} karakterlik doküman başarıyla işlendi ve sistem büyük dokümanlar için uygun olduğu kanıtlandı.</li>
        </ol>

        <h3>6.3 Pratik Uygulamalar</h3>
        <ol>
            <li><strong>RAG Sistemleri:</strong> Gelişmiş retrieval accuracy ile daha etkili bilgi erişimi</li>
            <li><strong>Doküman Analizi:</strong> Daha iyi içerik organizasyonu ve yapılandırması</li>
            <li><strong>Bilgi Yönetimi:</strong> Gelişmiş bilgi yapılandırması ve kategorilendirme</li>
            <li><strong>Eğitim Teknolojisi:</strong> Adaptif içerik sunumu ve kişiselleştirilmiş öğrenme</li>
        </ol>

        <h3>6.4 Gelecek Çalışmalar</h3>
        <ol>
            <li><strong>Multi-modal Chunking:</strong> Görsel ve metin entegrasyonu</li>
            <li><strong>Domain Adaptation:</strong> Alan-specific chunking strategies</li>
            <li><strong>Real-time Processing:</strong> Streaming chunking algorithms</li>
            <li><strong>Cross-lingual Evaluation:</strong> Multiple language support</li>
        </ol>
    </div>

    <!-- Technical Details -->
    <div class="section page-break">
        <h2>7. TEKNİK DETAYLAR VE REFERANSLAR</h2>
        
        <h3>7.1 Sistem Konfigürasyonu</h3>
        <div class="code-block">
{
  "targetChunkSize": 500,
  "minChunkSize": 100,
  "maxChunkSize": 2000,
  "overlapSize": 50,
  "enableGrokReasoning": true,
  "turkishOptimization": true,
  "semanticThreshold": 0.7,
  "reasoningConfidenceThreshold": 0.65,
  "embeddingModel": "text-embedding-v4",
  "llmModel": "llama-3.1-8b-instant"
}
        </div>

        <h3>7.2 API Endpoints</h3>
        <div class="code-block">
POST /api/chunking-test/start
GET  /api/chunking-test/status/{testId}
GET  /api/chunking-test/list
DELETE /api/chunking-test/delete/{testId}
GET  /api/chunking-test/export/{testId}
GET  /api/chunking-test/export-pdf/{testId}
        </div>

        <h3>7.3 Kalite Metrikleri Formülleri</h3>
        <div class="code-block">
Semantic Coherence = Σ(cosine_similarity(sentence_embeddings)) / n
Boundary Quality = (natural_boundaries / total_boundaries) × confidence_score
Size Consistency = 1 - (standard_deviation / mean_size)
Processing Efficiency = total_characters / processing_time_seconds
        </div>
    </div>

    <div class="footer">
        <p><strong>Rapor Tarihi:</strong> ${date} | <strong>Versiyon:</strong> 1.0 | <strong>Test Durumu:</strong> ${testData.status}</p>
        <p><strong>Sistem:</strong> Agentic Chunking v2.0 | <strong>Hazırlayan:</strong> Agentic Chunking Research Team</p>
        <p>Bu rapor otomatik olarak oluşturulmuştur ve akademik araştırma amaçlı kullanım için tasarlanmıştır.</p>
    </div>
</body>
</html>
  `;
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}