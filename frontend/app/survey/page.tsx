"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";

interface SurveyAnswers {
  // Temel Bilgiler
  age?: string;
  education?: string;
  field?: string;
  
  // Deneyim
  personalizedPlatform?: string;
  platformExperience?: string;
  aiExperience?: string;
  
  // Beklentiler
  expectations?: string;
  concerns?: string;
}

export default function SurveyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const totalSteps = 3;

  // Check if user has already completed survey
  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${getApiUrl()}/aprag/survey/status/${user.id}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.has_completed) {
            setHasCompleted(true);
            setIsSubmitted(true);
          }
        }
      } catch (error) {
        console.error("Error checking survey status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSurveyStatus();
  }, [user, router]);

  const handleAnswerChange = (field: keyof SurveyAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/aprag/survey/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            user_id: user.id,
            answers: {
              age: answers.age,
              education: answers.education,
              field: answers.field,
              personalized_platform: answers.personalizedPlatform,
              platform_experience: answers.platformExperience,
              ai_experience: answers.aiExperience,
              expectations: answers.expectations,
              concerns: answers.concerns,
            },
          }),
        }
      );

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        if (errorData.detail?.includes("zaten tamamlanmış")) {
          setHasCompleted(true);
          setIsSubmitted(true);
        } else {
          alert("Anket kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
        }
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Anket kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(answers.age && answers.education);
      case 2:
        return !!(answers.personalizedPlatform && answers.platformExperience);
      case 3:
        return true; // Son adım opsiyonel
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Yükleniyor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted || hasCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {hasCompleted ? "Anket Zaten Tamamlanmış" : "Teşekkürler!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {hasCompleted
                ? "Bu anketi daha önce tamamladınız. Her kullanıcı anketi yalnızca bir kez doldurabilir."
                : "Anketiniz başarıyla gönderildi. Katılımınız için teşekkür ederiz."}
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/system-info">
                <Button variant="outline">Sistem Hakkında</Button>
              </Link>
              <Link href="/student">
                <Button>Öğrenci Paneline Dön</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Adım {currentStep} / {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              %{Math.round((currentStep / totalSteps) * 100)} tamamlandı
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {currentStep === 1 && "Temel Bilgiler"}
              {currentStep === 2 && "Deneyim ve Geçmiş"}
              {currentStep === 3 && "Beklentiler ve Görüşler"}
            </CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1 && "Sizinle ilgili temel bilgileri öğrenmek istiyoruz"}
              {currentStep === 2 && "Daha önceki deneyimleriniz hakkında bilgi verin"}
              {currentStep === 3 && "Sistemden beklentilerinizi paylaşın"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Bilimsel Araştırma Bilgilendirmesi */}
            {currentStep === 1 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg -mt-2">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Bilimsel Araştırma Hakkında</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Bu anket, <strong>Burdur Mehmet Akif Ersoy Üniversitesi Fen Bilimleri Enstitüsü Yazılım Mühendisliği</strong> alanında 
                      <strong> Engin DALGA</strong> tarafından yürütülen bilimsel bir araştırmanın parçasıdır. 
                      Toplanan veriler yalnızca bilimsel araştırma amaçlı kullanılacak olup, kişisel bilgileriniz gizli tutulacaktır. 
                      Katılımınız için teşekkür ederiz.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Step 1: Temel Bilgiler */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="age" className="text-base font-semibold">
                    Yaşınız
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Örn: 20"
                    value={answers.age || ""}
                    onChange={(e) => handleAnswerChange("age", e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Eğitim Durumunuz
                  </Label>
                  <RadioGroup
                    value={answers.education || ""}
                    onValueChange={(value) => handleAnswerChange("education", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="lise" id="lise" />
                      <Label htmlFor="lise" className="cursor-pointer font-normal">
                        Lise
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="universite" id="universite" />
                      <Label htmlFor="universite" className="cursor-pointer font-normal">
                        Üniversite (Lisans)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="yuksek_lisans" id="yuksek_lisans" />
                      <Label htmlFor="yuksek_lisans" className="cursor-pointer font-normal">
                        Yüksek Lisans
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="doktora" id="doktora" />
                      <Label htmlFor="doktora" className="cursor-pointer font-normal">
                        Doktora
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="field" className="text-base font-semibold">
                    Çalıştığınız/Okuduğunuz Alan (Opsiyonel)
                  </Label>
                  <Input
                    id="field"
                    placeholder="Örn: Bilgisayar Mühendisliği, Matematik, vb."
                    value={answers.field || ""}
                    onChange={(e) => handleAnswerChange("field", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Deneyim */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Daha önce kişiselleştirilmiş bir eğitim platformu kullandınız mı?
                  </Label>
                  <RadioGroup
                    value={answers.personalizedPlatform || ""}
                    onValueChange={(value) => handleAnswerChange("personalizedPlatform", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="evet" id="evet" />
                      <Label htmlFor="evet" className="cursor-pointer font-normal">
                        Evet, kullandım
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="hayir" id="hayir" />
                      <Label htmlFor="hayir" className="cursor-pointer font-normal">
                        Hayır, ilk kez kullanacağım
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Eğitim teknolojileri konusundaki deneyiminiz nasıl?
                  </Label>
                  <RadioGroup
                    value={answers.platformExperience || ""}
                    onValueChange={(value) => handleAnswerChange("platformExperience", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="cok_deneyimli" id="cok_deneyimli" />
                      <Label htmlFor="cok_deneyimli" className="cursor-pointer font-normal">
                        Çok deneyimliyim
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="orta" id="orta" />
                      <Label htmlFor="orta" className="cursor-pointer font-normal">
                        Orta seviyede
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="az" id="az" />
                      <Label htmlFor="az" className="cursor-pointer font-normal">
                        Az deneyimliyim
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="yok" id="yok" />
                      <Label htmlFor="yok" className="cursor-pointer font-normal">
                        Hiç deneyimim yok
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Yapay zeka destekli sistemler hakkında ne düşünüyorsunuz?
                  </Label>
                  <RadioGroup
                    value={answers.aiExperience || ""}
                    onValueChange={(value) => handleAnswerChange("aiExperience", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="cok_pozitif" id="cok_pozitif" />
                      <Label htmlFor="cok_pozitif" className="cursor-pointer font-normal">
                        Çok olumlu, heyecanlıyım
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="pozitif" id="pozitif" />
                      <Label htmlFor="pozitif" className="cursor-pointer font-normal">
                        Olumlu
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="tarafsiz" id="tarafsiz" />
                      <Label htmlFor="tarafsiz" className="cursor-pointer font-normal">
                        Tarafsızım
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="endiseli" id="endiseli" />
                      <Label htmlFor="endiseli" className="cursor-pointer font-normal">
                        Biraz endişeliyim
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 3: Beklentiler */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="expectations" className="text-base font-semibold">
                    Bu sistemden en çok ne bekliyorsunuz? (Opsiyonel)
                  </Label>
                  <Textarea
                    id="expectations"
                    placeholder="Beklentilerinizi, umutlarınızı veya merak ettiğiniz özellikleri yazabilirsiniz..."
                    value={answers.expectations || ""}
                    onChange={(e) => handleAnswerChange("expectations", e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="concerns" className="text-base font-semibold">
                    Herhangi bir endişeniz veya sormak istediğiniz bir şey var mı? (Opsiyonel)
                  </Label>
                  <Textarea
                    id="concerns"
                    placeholder="Endişelerinizi veya sorularınızı paylaşabilirsiniz..."
                    value={answers.concerns || ""}
                    onChange={(e) => handleAnswerChange("concerns", e.target.value)}
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Geri
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!isStepComplete(currentStep)}
                  className="flex items-center gap-2"
                >
                  İleri
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      Anketi Tamamla
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Link */}
        <div className="text-center mt-6">
          <Link href="/system-info" className="text-blue-600 hover:text-blue-800 text-sm">
            Sistem hakkında daha fazla bilgi edinmek için tıklayın
          </Link>
        </div>
      </div>
    </div>
  );
}

