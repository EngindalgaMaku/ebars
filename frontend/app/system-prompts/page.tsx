"use client";

import React, { useEffect, useMemo, useState } from "react";
import TeacherLayout from "../components/TeacherLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useApi } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useAuth";

type Lang = "tr" | "en";

type PromptBundle = {
  rag: Record<Lang, string>;
  rag_user: Record<Lang, string>;
  direct: Record<Lang, string>;
};

type GetResponse = {
  success: boolean;
  defaults: PromptBundle;
  overrides: Partial<PromptBundle>;
  effective: PromptBundle;
};

export default function SystemPromptsPage() {
  const api = useApi();
  const { isAdmin, isTeacher } = useRoles();
  const hasAccess = isAdmin || isTeacher;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [defaults, setDefaults] = useState<PromptBundle | null>(null);
  const [current, setCurrent] = useState<PromptBundle | null>(null);
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const formatJson = (val: any) => JSON.stringify(val, null, 2);

  const validatePromptBundle = (obj: any): obj is PromptBundle => {
    const types = ["rag", "rag_user", "direct"] as const;
    for (const t of types) {
      if (!obj || typeof obj !== "object" || typeof obj[t] !== "object") return false;
      if (typeof obj[t].tr !== "string") return false;
      if (typeof obj[t].en !== "string") return false;
    }
    return true;
  };

  const parsedJson = useMemo(() => {
    if (!jsonText.trim()) {
      setJsonError("JSON boş olamaz");
      return null;
    }

    try {
      const obj = JSON.parse(jsonText);
      if (!validatePromptBundle(obj)) {
        setJsonError(
          "Şema hatası: JSON şu alanları içermeli: rag.tr, rag.en, rag_user.tr, rag_user.en, direct.tr, direct.en"
        );
        return null;
      }
      setJsonError(null);
      return obj as PromptBundle;
    } catch (e: any) {
      setJsonError(e?.message || "Geçersiz JSON");
      return null;
    }
  }, [jsonText]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await api.get<GetResponse>("/system-prompts");
      if (!resp?.success) throw new Error("Promptlar yüklenemedi");
      setDefaults(resp.defaults);
      setCurrent(resp.effective);
      setJsonText(formatJson(resp.effective));
    } catch (e: any) {
      toast.error(e?.message || "Promptlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess]);

  const save = async () => {
    if (!parsedJson) {
      toast.error(jsonError || "Geçersiz JSON");
      return;
    }
    setSaving(true);
    try {
      const resp = await api.put<GetResponse>("/system-prompts", parsedJson);
      if (!resp?.success) throw new Error("Kaydedilemedi");
      setDefaults(resp.defaults);
      setCurrent(resp.effective);
      setJsonText(formatJson(resp.effective));
      toast.success("Promptlar kaydedildi");
    } catch (e: any) {
      toast.error(e?.message || "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!confirm("Tüm sistem promptlarını varsayılana döndürmek istiyor musunuz?")) return;
    setSaving(true);
    try {
      const resp = await api.delete<GetResponse>("/system-prompts");
      if (!resp?.success) throw new Error("Sıfırlanamadı");
      setDefaults(resp.defaults);
      setCurrent(resp.effective);
      setJsonText(formatJson(resp.effective));
      toast.success("Varsayılan promptlara dönüldü");
    } catch (e: any) {
      toast.error(e?.message || "Sıfırlanamadı");
    } finally {
      setSaving(false);
    }
  };

  const loadDefaultsIntoEditor = () => {
    if (!defaults) return;
    setJsonText(formatJson(defaults));
  };

  const loadEffectiveIntoEditor = () => {
    if (!current) return;
    setJsonText(formatJson(current));
  };

  const prettyPrintEditor = () => {
    if (!parsedJson) {
      toast.error(jsonError || "Geçersiz JSON");
      return;
    }
    setJsonText(formatJson(parsedJson));
  };

  if (!hasAccess) {
    return (
      <TeacherLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Erişim Reddedildi</CardTitle>
              <CardDescription>
                Bu sayfa yalnızca <strong>teacher</strong> veya <strong>admin</strong> kullanıcıları içindir.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </TeacherLayout>
    );
  }

  if (loading || !current || !defaults) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-3 text-gray-600">Yükleniyor...</span>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistem Promptu Yönetimi</h1>
            <p className="text-sm text-gray-600 mt-1">
              Sistem promptlarını TR/EN olarak düzenleyin. Bu değerler kaydedildiğinde tüm sistem cevaplarını etkiler.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetAll} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              <span className="ml-2">Varsayılana Dön</span>
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="ml-2">Kaydet</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Prompt JSON Editörü
            </CardTitle>
            <CardDescription>
              JSON formatında tüm prompt setini düzenleyin. Kaydetmeden önce JSON formatı ve şema doğrulanır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>JSON</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadEffectiveIntoEditor}>
                    Mevcut Değeri Yükle
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadDefaultsIntoEditor}>
                    Varsayılanı Yükle
                  </Button>
                  <Button variant="outline" size="sm" onClick={prettyPrintEditor}>
                    Formatla
                  </Button>
                </div>
              </div>
              <Textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className={`min-h-[420px] font-mono text-sm ${
                  jsonError ? "border-red-400 focus-visible:ring-red-400" : ""
                }`}
              />
              {jsonError ? (
                <div className="text-xs text-red-600">{jsonError}</div>
              ) : (
                <div className="text-xs text-gray-500">
                  Placeholder notları: RAG System için <code>{"{session_context}"}</code> ve <code>{"{course_scope_instruction}"}</code>. RAG User için <code>{"{context}"}</code> ve <code>{"{query}"}</code>.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
