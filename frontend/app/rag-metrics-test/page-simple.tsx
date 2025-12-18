"use client";

import React from "react";
import TeacherLayout from "../components/TeacherLayout";

export default function RAGMetricsTestPageSimple() {
  return (
    <TeacherLayout activeTab="rag-metrics-test">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold">RAG Metrikleri Testi (RAGAS)</h1>
        <p className="text-muted-foreground mt-2">
          Test sayfası - Basit versiyon
        </p>
      </div>
    </TeacherLayout>
  );
}

