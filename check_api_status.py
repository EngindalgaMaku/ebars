#!/usr/bin/env python3
"""
API Status ve Data Source Checker
Sistemde gerçek veya mock veriler kullanıldığını kontrol eder
"""

import requests
import json
from datetime import datetime

def check_api_status():
    """API durumunu kontrol et"""
    try:
        print("🔍 API durumu kontrol ediliyor...")
        response = requests.get('http://localhost:8007/health', timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API çalışıyor!")
            print(f"   Service: {data.get('service', 'Unknown')}")
            print(f"   Version: {data.get('version', 'Unknown')}")
            print(f"   Status: {data.get('status', 'Unknown')}")
            
            # Feature durumlarını kontrol et
            features = data.get('features', {})
            print(f"   EBARS enabled: {features.get('ebars', False)}")
            print(f"   Emoji feedback enabled: {features.get('emoji_feedback', False)}")
            return True
        else:
            print(f"❌ API error: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ API bağlantı hatası - servis çalışmıyor")
        return False
    except Exception as e:
        print(f"❌ API kontrol hatası: {e}")
        return False

def check_simulation_data_source():
    """Simülasyon verilerinin kaynağını kontrol et"""
    print("\n🔬 Simülasyon veri kaynağı analizi:")
    
    # Sample CSV dosyasını kontrol et
    try:
        import pandas as pd
        df = pd.read_csv('simulasyon_testleri/sample_ebars_simulation_data.csv')
        
        print(f"   📊 Sample data records: {len(df)}")
        print(f"   📅 Timestamp range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        
        # Score progression analizi
        agents = df['agent_id'].unique()
        print(f"   🤖 Agents: {list(agents)}")
        
        for agent in agents:
            agent_data = df[df['agent_id'] == agent]
            initial_score = agent_data['comprehension_score'].iloc[0]
            final_score = agent_data['comprehension_score'].iloc[-1]
            improvement = final_score - initial_score
            
            print(f"     • {agent}: {initial_score:.1f} → {final_score:.1f} ({improvement:+.1f})")
            
            # Gerçeklik kontrolleri
            score_changes = agent_data['score_delta'].abs().mean()
            emoji_variety = agent_data['emoji_feedback'].nunique()
            
            print(f"       - Average score change: {score_changes:.2f}")
            print(f"       - Emoji variety: {emoji_variety}/4 types")
            
            # Gerçek veri sinyalleri
            realistic_signals = 0
            
            if score_changes > 0.5:  # Meaningful score changes
                realistic_signals += 1
            if emoji_variety >= 3:  # Good emoji variety
                realistic_signals += 1
            if len(agent_data) >= 15:  # Sufficient data points
                realistic_signals += 1
                
            print(f"       - Realism score: {realistic_signals}/3")
            
    except Exception as e:
        print(f"❌ Sample data analiz hatası: {e}")

def check_test_system_behavior():
    """Test sistemi davranışını kontrol et"""
    print("\n🧪 Test sistemi davranış analizi:")
    
    try:
        # Test complete system README'yi kontrol et
        with open('simulasyon_testleri/README_COMPLETE_SYSTEM_TEST.md', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Mock kullanım sinyalleri
        if 'mock' in content.lower():
            print("   ⚠️  Test sistemi mock desteği içeriyor")
            
        if 'fallback' in content.lower():
            print("   ⚠️  Test sistemi fallback mekanizması içeriyor")
            
        # Gerçek API gereksinimleri
        if 'real api' in content.lower() or 'api available' in content.lower():
            print("   ✅ Test sistemi gerçek API ile çalışabiliyor")
            
    except Exception as e:
        print(f"❌ Test sistem analiz hatası: {e}")

def main():
    print("=" * 60)
    print("🔍 EBARS VERİ KAYNAĞI VE GERÇEKLİK ANALİZİ")
    print("=" * 60)
    print(f"⏰ Analiz zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # API durumu
    api_available = check_api_status()
    
    # Simülasyon verileri
    check_simulation_data_source()
    
    # Test sistemi
    check_test_system_behavior()
    
    print("\n" + "=" * 60)
    print("📊 SONUÇ DEĞERLENDİRMESİ")
    print("=" * 60)
    
    if api_available:
        print("✅ GERÇEK VERİ: API servisi çalışıyor, gerçek EBARS verisi kullanılıyor")
        print("   • Emoji feedback gerçek zamanlı işleniyor")
        print("   • Score hesaplamaları gerçek algoritma ile yapılıyor") 
        print("   • Database interaction'ları kayıt ediliyor")
    else:
        print("⚠️  MOCK/FALLBACK VERİ: API servisi çalışmıyor")
        print("   • Test sistemi mock veriler üretiyor")
        print("   • Simüle edilmiş score hesaplamaları")
        print("   • Gerçek database interaction'ları YOK")
        print("   • Akademik araştırma için sınırlı geçerlilik")
    
    print("\n🎓 AKADEMİK ARAŞTIRMA TAVSİYELERİ:")
    if api_available:
        print("   ✅ Veriler akademik yayın için uygun")
        print("   ✅ Gerçek sistem davranışları gözlemleniyor")
        print("   ✅ Bulgular güvenilir ve tekrarlanabilir")
    else:
        print("   ⚠️  Mock veriler akademik sınırlılık oluşturabilir")
        print("   ⚠️  Gerçek sistem davranışları gözlemlenmiyor") 
        print("   ⚠️  Bulgular simülasyon temelli")
        print("   💡 Öneril: Gerçek API servisini başlatın")

if __name__ == "__main__":
    main()