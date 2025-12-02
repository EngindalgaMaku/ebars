"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageSquare, Target, Zap, Users, Brain } from "lucide-react";

export default function SystemInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            eBARS Eğitim Asistanı Sistemi
          </h1>
          <p className="text-xl text-gray-600">
            Kişiselleştirilmiş ve Adaptif Öğrenme Deneyimi
          </p>
        </div>

        {/* Sistem Amacı */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-2xl">Sistemin Amacı</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p className="text-lg leading-relaxed">
              eBARS (Educational BARS - Educational Retrieval-Augmented System), öğrencilere 
              kişiselleştirilmiş ve adaptif bir öğrenme deneyimi sunmak için tasarlanmış 
              modern bir eğitim asistanı sistemidir.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Brain className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Akıllı İçerik Önerileri</h3>
                  <p className="text-sm text-gray-600">
                    Öğrenci seviyesine ve ilgi alanlarına göre özelleştirilmiş içerik önerileri
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Anlık Yanıtlar</h3>
                  <p className="text-sm text-gray-600">
                    Eğitim materyallerinizden anında, doğru ve bağlama uygun yanıtlar
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Kişiselleştirme</h3>
                  <p className="text-sm text-gray-600">
                    Her öğrenci için özel öğrenme profili ve adaptif içerik sunumu
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Sürekli İyileştirme</h3>
                  <p className="text-sm text-gray-600">
                    Geri bildirimlerinize göre sistemin sürekli gelişmesi ve öğrenmesi
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nasıl Kullanılır */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-green-600" />
              <CardTitle className="text-2xl">Sisteme Nasıl Girilir?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Hesap Oluşturma</h3>
                  <p className="text-gray-600">
                    Sisteme giriş yapmak için öncelikle bir hesap oluşturmanız gerekmektedir. 
                    Kayıt işlemi sırasında temel bilgileriniz (isim, e-posta, şifre) toplanır.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Giriş Yapma</h3>
                  <p className="text-gray-600">
                    Oluşturduğunuz hesap bilgileri ile sisteme giriş yapabilirsiniz. 
                    Giriş sonrası öğrenci paneline yönlendirilirsiniz.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Doküman Yükleme</h3>
                  <p className="text-gray-600">
                    Öğrenmek istediğiniz konuya ait PDF veya DOCX formatındaki ders notlarınızı 
                    sisteme yükleyebilirsiniz. Sistem bu dokümanları otomatik olarak işler.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Soru Sorma</h3>
                  <p className="text-gray-600">
                    Yüklediğiniz dokümanlar hakkında sorularınızı sorabilirsiniz. Sistem, 
                    dokümanlarınızdan ilgili bilgileri bulup size anlaşılır bir şekilde sunar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistem Nasıl Çalışır */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-600" />
              <CardTitle className="text-2xl">Sistem Nasıl Çalışır?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-6 text-base">
              eBARS sistemi, modern microservis mimarisi ile çalışan, yapay zeka destekli 
              bir eğitim platformudur. İşte sistemin çalışma prensipleri:
            </CardDescription>
            
            <div className="space-y-6">
              {/* Doküman İşleme */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-600">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  1. Doküman İşleme Süreci
                </h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Yüklediğiniz PDF/DOCX dosyaları otomatik olarak Markdown formatına dönüştürülür</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Metin, anlam bütünlüğünü koruyarak akıllı parçalara (chunk) ayrılır</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Her parça, yapay zeka modelleri kullanılarak vektörlere dönüştürülür</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Vektörler, hızlı arama için özel bir veritabanında saklanır</span>
                  </li>
                </ul>
              </div>

              {/* Sorgu İşleme */}
              <div className="p-5 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-600">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  2. Soru Sorma ve Yanıt Üretme
                </h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Sorduğunuz soru, öğrenme profilinize göre analiz edilir</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Sistem, dokümanlarınızdan en ilgili bilgileri bulur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Bulunan bilgiler, seviyenize uygun bir dilde düzenlenir</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Yanıt, kaynak referansları ile birlikte size sunulur</span>
                  </li>
                </ul>
              </div>

              {/* Kişiselleştirme */}
              <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-600">
                <h3 className="font-semibold text-lg text-gray-900 mb-3">
                  3. Kişiselleştirme ve Öğrenme
                </h3>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Sistem, her etkileşiminizden öğrenir ve profilinizi günceller</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Verdiğiniz geri bildirimler, gelecekteki yanıtları iyileştirir</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Öğrenme seviyenize göre içerik zorluk seviyesi ayarlanır</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>İlgi alanlarınıza uygun konu önerileri sunulur</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Teknik Detaylar */}
            <div className="mt-8 p-5 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                Teknik Altyapı
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                eBARS sistemi, modern microservis mimarisi ile çalışmaktadır. Sistem, 
                bağımsız servislerden oluşur ve her servis kendi sorumluluğunu yerine getirir. 
                Bu yapı sayesinde sistem yüksek performans, ölçeklenebilirlik ve güvenilirlik 
                sağlar. Doküman işleme, yapay zeka model entegrasyonu, vektör arama ve 
                kişiselleştirme gibi işlemler farklı servisler tarafından yönetilir.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
            <CardContent className="py-8">
              <h2 className="text-2xl font-bold mb-4">Hazır mısınız?</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Sistemi denemek ve anketimize katılmak için aşağıdaki butona tıklayın.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/survey">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                  >
                    Ankete Başla
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 font-semibold"
                  >
                    Sisteme Giriş Yap
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




