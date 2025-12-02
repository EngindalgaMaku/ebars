"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/api";

interface SurveyAnswers {
  // Temel Bilgiler
  age?: string;
  education?: string;
  profession?: string;
  professionOther?: string;
  
  // Likert Ölçeği Soruları (1-5: Kesinlikle Katılmıyorum -> Kesinlikle Katılıyorum)
  // Sistem Kullanılabilirliği
  q1_usability?: string; // Sistemin arayüzü kullanıcı dostu ve anlaşılır
  q2_navigation?: string; // Sistemde gezinmek kolay ve sezgisel
  q3_learning?: string; // Sistemi kullanmayı öğrenmek kolaydı
  q4_speed?: string; // Sistem hızlı yanıt veriyor
  
  // Sistem Etkinliği
  q5_learning_contribution?: string; // Sistem öğrenmeme katkı sağladı
  q6_useful_answers?: string; // Sistemin verdiği cevaplar yararlı ve bilgilendirici
  q7_accurate_answers?: string; // Sistemin verdiği cevaplar doğru ve güvenilir
  q8_clear_answers?: string; // Sistemin cevapları anlaşılır ve açıklayıcı
  
  // Emoji Geri Bildirim
  q9_emoji_easy?: string; // Emoji geri bildirim vermek kolay ve hızlı
  q10_emoji_response?: string; // Sistem emoji geri bildirimlerime anında tepki verdi
  q11_emoji_noticed?: string; // Sistemin zorluk seviyesini değiştirdiğini fark ettim
  
  // Adaptif Özellikler
  q12_difficulty_appropriate?: string; // Sistem cevaplarının zorluk seviyesi anlama seviyeme uygundu
  q13_simplified?: string; // Sistem zorlandığımda cevapları basitleştirdi
  q14_difficultied?: string; // Sistem başarılı olduğumda cevapları zorlaştırdı
  q15_adaptive_helpful?: string; // Sistemin adaptif özelliği öğrenmeme yardımcı oldu
  q16_personalized?: string; // Sistem benim için kişiselleştirilmiş cevaplar üretti
  
  // Kullanıcı Memnuniyeti
  q17_satisfied?: string; // Sistemden genel olarak memnun kaldım
  q18_expectations?: string; // Sistem beklentilerimi karşıladı
  q19_enjoyable?: string; // Sistem kullanımı keyifliydi
  q20_recommend?: string; // Bu sistemi arkadaşlarıma öneririm
}

const LIKERT_OPTIONS = [
  { value: "1", label: "Kesinlikle Katılmıyorum" },
  { value: "2", label: "Katılmıyorum" },
  { value: "3", label: "Kararsızım" },
  { value: "4", label: "Katılıyorum" },
  { value: "5", label: "Kesinlikle Katılıyorum" },
];

const LIKERT_QUESTIONS = [
  // Sistem Kullanılabilirliği (1-4)
  {
    id: "q1_usability",
    category: "Sistem Kullanılabilirliği",
    statement: "Sistemin arayüzü kullanıcı dostu ve anlaşılır.",
    reverse: false,
  },
  {
    id: "q2_navigation",
    category: "Sistem Kullanılabilirliği",
    statement: "Sistemde gezinmek kolay ve sezgisel.",
    reverse: false,
  },
  {
    id: "q3_learning",
    category: "Sistem Kullanılabilirliği",
    statement: "Sistemi kullanmayı öğrenmek zordu.",
    reverse: true, // TERS SORU
  },
  {
    id: "q4_speed",
    category: "Sistem Kullanılabilirliği",
    statement: "Sistem hızlı yanıt veriyor.",
    reverse: false,
  },
  
  // Sistem Etkinliği (5-8)
  {
    id: "q5_learning_contribution",
    category: "Sistem Etkinliği",
    statement: "Sistem öğrenmeme katkı sağladı.",
    reverse: false,
  },
  {
    id: "q6_useful_answers",
    category: "Sistem Etkinliği",
    statement: "Sistemin verdiği cevaplar yararlı ve bilgilendirici.",
    reverse: false,
  },
  {
    id: "q7_accurate_answers",
    category: "Sistem Etkinliği",
    statement: "Sistemin verdiği cevaplar yanlış veya güvenilir değil.",
    reverse: true, // TERS SORU
  },
  {
    id: "q8_clear_answers",
    category: "Sistem Etkinliği",
    statement: "Sistemin cevapları anlaşılır ve açıklayıcı.",
    reverse: false,
  },
  
  // Emoji Geri Bildirim (9-11)
  {
    id: "q9_emoji_easy",
    category: "Emoji Geri Bildirim",
    statement: "Emoji geri bildirim vermek kolay ve hızlı.",
    reverse: false,
  },
  {
    id: "q10_emoji_response",
    category: "Emoji Geri Bildirim",
    statement: "Sistem emoji geri bildirimlerime tepki vermedi.",
    reverse: true, // TERS SORU
  },
  {
    id: "q11_emoji_noticed",
    category: "Emoji Geri Bildirim",
    statement: "Sistemin zorluk seviyesini değiştirdiğini fark ettim.",
    reverse: false,
  },
  
  // Adaptif Özellikler (12-16)
  {
    id: "q12_difficulty_appropriate",
    category: "Adaptif Özellikler",
    statement: "Sistem cevaplarının zorluk seviyesi anlama seviyeme uygun değildi.",
    reverse: true, // TERS SORU
  },
  {
    id: "q13_simplified",
    category: "Adaptif Özellikler",
    statement: "Sistem zorlandığımda cevapları basitleştirdi.",
    reverse: false,
  },
  {
    id: "q14_difficultied",
    category: "Adaptif Özellikler",
    statement: "Sistem başarılı olduğumda cevapları zorlaştırdı.",
    reverse: false,
  },
  {
    id: "q15_adaptive_helpful",
    category: "Adaptif Özellikler",
    statement: "Sistemin adaptif özelliği öğrenmeme yardımcı oldu.",
    reverse: false,
  },
  {
    id: "q16_personalized",
    category: "Adaptif Özellikler",
    statement: "Sistem benim için kişiselleştirilmiş cevaplar üretti.",
    reverse: false,
  },
  
  // Kullanıcı Memnuniyeti (17-20)
  {
    id: "q17_satisfied",
    category: "Kullanıcı Memnuniyeti",
    statement: "Sistemden genel olarak memnun kaldım.",
    reverse: false,
  },
  {
    id: "q18_expectations",
    category: "Kullanıcı Memnuniyeti",
    statement: "Sistem beklentilerimi karşılamadı.",
    reverse: true, // TERS SORU
  },
  {
    id: "q19_enjoyable",
    category: "Kullanıcı Memnuniyeti",
    statement: "Sistem kullanımı keyifliydi.",
    reverse: false,
  },
  {
    id: "q20_recommend",
    category: "Kullanıcı Memnuniyeti",
    statement: "Bu sistemi arkadaşlarıma öneririm.",
    reverse: false,
  },
];

export default function SurveyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Adım 1: Temel Bilgiler, Adım 2-6: Likert soruları (her adımda 4 soru)
  const totalSteps = 6;
  const questionsPerStep = 4;

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
            answers: answers,
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
    if (step === 1) {
      return !!(answers.age && answers.education && answers.profession);
    }
    
    // Likert soruları için kontrol
    const startIdx = (step - 2) * questionsPerStep;
    const endIdx = Math.min(startIdx + questionsPerStep, LIKERT_QUESTIONS.length);
    const stepQuestions = LIKERT_QUESTIONS.slice(startIdx, endIdx);
    
    return stepQuestions.every(q => answers[q.id as keyof SurveyAnswers]);
  };

  const getCurrentStepQuestions = () => {
    if (currentStep === 1) return [];
    const startIdx = (currentStep - 2) * questionsPerStep;
    const endIdx = Math.min(startIdx + questionsPerStep, LIKERT_QUESTIONS.length);
    return LIKERT_QUESTIONS.slice(startIdx, endIdx);
  };

  const getStepTitle = () => {
    if (currentStep === 1) return "Temel Bilgiler";
    const questions = getCurrentStepQuestions();
    if (questions.length > 0) {
      return questions[0].category;
    }
    return "Likert Ölçeği";
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
              {getStepTitle()}
            </CardTitle>
            <CardDescription className="text-center">
              {currentStep === 1 
                ? "Sizinle ilgili temel bilgileri öğrenmek istiyoruz"
                : currentStep === 2
                ? "Lütfen aşağıdaki ifadelere ne kadar katıldığınızı belirtiniz"
                : "Devam ediyoruz..."}
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

            {/* Likert Ölçeği Açıklaması */}
            {currentStep === 2 && (
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg -mt-2">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 mb-2">Likert Ölçeği</h3>
                    <p className="text-sm text-purple-800 leading-relaxed">
                      Lütfen aşağıdaki ifadelere ne kadar katıldığınızı belirtmek için 5 noktalı ölçeği kullanınız:
                    </p>
                    <ul className="text-sm text-purple-800 mt-2 space-y-1 list-disc list-inside">
                      <li><strong>1:</strong> Kesinlikle Katılmıyorum</li>
                      <li><strong>2:</strong> Katılmıyorum</li>
                      <li><strong>3:</strong> Kararsızım</li>
                      <li><strong>4:</strong> Katılıyorum</li>
                      <li><strong>5:</strong> Kesinlikle Katılıyorum</li>
                    </ul>
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
                  <Label className="text-base font-semibold mb-3 block">
                    Mesleğiniz
                  </Label>
                  <RadioGroup
                    value={answers.profession || ""}
                    onValueChange={(value) => handleAnswerChange("profession", value)}
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="ogretmen" id="ogretmen" />
                      <Label htmlFor="ogretmen" className="cursor-pointer font-normal">
                        Öğretmen
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="ogrenci" id="ogrenci" />
                      <Label htmlFor="ogrenci" className="cursor-pointer font-normal">
                        Öğrenci
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="diger" id="diger" />
                      <Label htmlFor="diger" className="cursor-pointer font-normal">
                        Diğer
                      </Label>
                    </div>
                  </RadioGroup>
                  {answers.profession === "diger" && (
                    <div className="mt-3">
                      <Input
                        id="professionOther"
                        placeholder="Mesleğinizi yazınız..."
                        value={answers.professionOther || ""}
                        onChange={(e) => handleAnswerChange("professionOther", e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Likert Ölçeği Soruları (Adım 2-6) */}
            {currentStep > 1 && (
              <div className="space-y-8">
                {getCurrentStepQuestions().map((question, idx) => (
                  <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="mb-4">
                      <div className="flex items-start gap-2 mb-2">
                        <Label className="text-base font-semibold text-gray-900 block flex-1">
                          {((currentStep - 2) * questionsPerStep) + idx + 1}. {question.statement}
                        </Label>
                        {question.reverse && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium whitespace-nowrap">
                            Ters Soru
                          </span>
                        )}
                      </div>
                      {question.reverse && (
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mb-4 rounded-r">
                          <p className="text-xs text-orange-800">
                            <strong>Not:</strong> Bu soru ters kodlanmıştır. Analizde otomatik olarak tersine çevrilecektir.
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 mb-4">
                        Lütfen bu ifadeye ne kadar katıldığınızı seçiniz:
                      </p>
                    </div>
                    <RadioGroup
                      value={answers[question.id as keyof SurveyAnswers] || ""}
                      onValueChange={(value) => handleAnswerChange(question.id as keyof SurveyAnswers, value)}
                    >
                      <div className="grid grid-cols-1 gap-3">
                        {LIKERT_OPTIONS.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-colors"
                          >
                            <RadioGroupItem value={option.value} id={`${question.id}_${option.value}`} />
                            <Label
                              htmlFor={`${question.id}_${option.value}`}
                              className="cursor-pointer font-normal flex-1 flex items-center gap-2"
                            >
                              <span className="font-semibold text-gray-700 w-6">{option.value}.</span>
                              <span className="text-gray-700">{option.label}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                ))}
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
