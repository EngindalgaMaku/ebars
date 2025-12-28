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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { useApi } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useAuth";

type Lang = "tr" | "en";

type PromptBundle = {
  rag: Record<Lang, string>;
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
  const [activeType, setActiveType] = useState<"rag" | "direct">("rag");
  const [activeLang, setActiveLang] = useState<Lang>("tr");

  const [defaults, setDefaults] = useState<PromptBundle | null>(null);
  const [current, setCurrent] = useState<PromptBundle | null>(null);

  const editorValue = useMemo(() => {
    if (!current) return "";
    return current[activeType][activeLang] || "";
  }, [current, activeType, activeLang]);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await api.get<GetResponse>("/system-prompts");
      if (!resp?.success) throw new Error("Promptlar yüklenemedi");
      setDefaults(resp.defaults);
      setCurrent(resp.effective);
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
    if (!current) return;
    setSaving(true);
    try {
      const resp = await api.put<GetResponse>("/system-prompts", current);
      if (!resp?.success) throw new Error("Kaydedilemedi");
      setDefaults(resp.defaults);
      setCurrent(resp.effective);
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
      toast.success("Varsayılan promptlara dönüldü");
    } catch (e: any) {
      toast.error(e?.message || "Sıfırlanamadı");
    } finally {
      setSaving(false);
    }
  };

  const resetCurrentEditorToDefault = () => {
    if (!defaults || !current) return;
    setCurrent({
      ...current,
      [activeType]: {
        ...current[activeType],
        [activeLang]: defaults[activeType][activeLang],
      },
    });
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
              Prompt Editörü
            </CardTitle>
            <CardDescription>
              `rag` promptu RAG cevap üretiminde kullanılır. `direct` promptu direkt (genel bilgi) modunda kullanılır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prompt Tipi</Label>
                <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rag">RAG</TabsTrigger>
                    <TabsTrigger value="direct">Direct</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="space-y-2">
                <Label>Dil</Label>
                <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tr">Türkçe</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Template</Label>
                <Button variant="outline" size="sm" onClick={resetCurrentEditorToDefault}>
                  Varsayılanı Yükle
                </Button>
              </div>
              <Textarea
                value={editorValue}
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrent({
                    ...current,
                    [activeType]: {
                      ...current[activeType],
                      [activeLang]: val,
                    },
                  });
                }}
                className="min-h-[320px] font-mono text-sm"
              />
              <div className="text-xs text-gray-500">
                Kullanılabilen placeholder'lar (RAG): <code>{"{session_context}"}</code> ve <code>{"{course_scope_instruction}"}</code>. Bu template'lerde bu format korunmalıdır.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  );
}
