"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award,
  Star,
  Trophy,
  Target,
  Zap,
  Brain,
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Lock,
  Unlock,
  Gift,
  Crown,
  Medal,
  Sparkles,
  Fire,
  Gem,
  Shield,
  Sword,
  Wand2,
  Rocket,
  Globe,
  Heart,
  Eye,
  Lightbulb,
  Code,
  Database,
  Settings,
  Activity,
  Calendar,
  MapPin,
  Flag,
  Mountain,
  Compass,
  Navigation,
  ChevronRight,
  ChevronDown,
  Info,
  Share2,
  Download,
  Copy,
  RefreshCw,
  Plus,
  Minus,
  X,
  Check
} from "lucide-react";

// Achievement interfaces
interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "learning" | "testing" | "quality" | "speed" | "exploration" | "mastery";
  type: "milestone" | "progressive" | "rare" | "daily" | "weekly" | "special";
  difficulty: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  icon: string;
  points: number;
  requirements: AchievementRequirement[];
  rewards?: AchievementReward[];
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  rarity: number; // 0-1, where 1 is most rare
  prerequisites?: string[];
}

interface AchievementRequirement {
  type: "test_count" | "quality_score" | "speed" | "scenario_complete" | "tutorial_complete" | "consecutive_days" | "total_chunks" | "perfect_score";
  value: number;
  description: string;
}

interface AchievementReward {
  type: "badge" | "title" | "feature" | "cosmetic";
  value: string;
  description: string;
}

interface UserProgress {
  level: number;
  totalPoints: number;
  totalTests: number;
  averageQuality: number;
  bestSpeed: number;
  completedScenarios: string[];
  completedTutorials: string[];
  consecutiveDays: number;
  totalChunks: number;
  perfectScores: number;
  lastActiveDate: string;
  achievements: string[];
  currentStreak: number;
  longestStreak: number;
}

interface AchievementSystemProps {
  userProgress: UserProgress;
  onAchievementUnlocked?: (achievement: Achievement) => void;
  onProgressUpdate?: (progress: UserProgress) => void;
  showNotifications?: boolean;
  enableSharing?: boolean;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userProgress,
  onAchievementUnlocked,
  onProgressUpdate,
  showNotifications = true,
  enableSharing = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rarity" | "points" | "progress" | "category">("rarity");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);

  // Comprehensive achievement definitions
  const achievements: Achievement[] = [
    // Learning Category
    {
      id: "first_steps",
      title: "İlk Adımlar",
      description: "İlk chunking testinizi tamamlayın",
      category: "learning",
      type: "milestone",
      difficulty: "bronze",
      icon: "👶",
      points: 10,
      requirements: [
        { type: "test_count", value: 1, description: "1 test tamamlayın" }
      ],
      unlocked: userProgress.totalTests >= 1,
      progress: Math.min(userProgress.totalTests, 1),
      maxProgress: 1,
      unlockedAt: userProgress.totalTests >= 1 ? userProgress.lastActiveDate : undefined,
      rarity: 0.1
    },
    {
      id: "tutorial_master",
      title: "Eğitim Uzmanı",
      description: "Tüm etkileşimli eğitim modüllerini tamamlayın",
      category: "learning",
      type: "milestone",
      difficulty: "silver",
      icon: "🎓",
      points: 50,
      requirements: [
        { type: "tutorial_complete", value: 3, description: "3 eğitim modülünü tamamlayın" }
      ],
      unlocked: userProgress.completedTutorials.length >= 3,
      progress: userProgress.completedTutorials.length,
      maxProgress: 3,
      unlockedAt: userProgress.completedTutorials.length >= 3 ? userProgress.lastActiveDate : undefined,
      rarity: 0.3
    },
    {
      id: "scenario_explorer",
      title: "Senaryo Kaşifi",
      description: "5 farklı test senaryosunu deneyin",
      category: "exploration",
      type: "progressive",
      difficulty: "bronze",
      icon: "🗺️",
      points: 25,
      requirements: [
        { type: "scenario_complete", value: 5, description: "5 farklı senaryo deneyin" }
      ],
      unlocked: userProgress.completedScenarios.length >= 5,
      progress: userProgress.completedScenarios.length,
      maxProgress: 5,
      unlockedAt: userProgress.completedScenarios.length >= 5 ? userProgress.lastActiveDate : undefined,
      rarity: 0.4
    },

    // Testing Category
    {
      id: "test_veteran",
      title: "Test Veteranı",
      description: "10 chunking testi tamamlayın",
      category: "testing",
      type: "progressive",
      difficulty: "silver",
      icon: "⚔️",
      points: 75,
      requirements: [
        { type: "test_count", value: 10, description: "10 test tamamlayın" }
      ],
      unlocked: userProgress.totalTests >= 10,
      progress: userProgress.totalTests,
      maxProgress: 10,
      unlockedAt: userProgress.totalTests >= 10 ? userProgress.lastActiveDate : undefined,
      rarity: 0.5
    },
    {
      id: "test_master",
      title: "Test Ustası",
      description: "50 chunking testi tamamlayın",
      category: "testing",
      type: "progressive",
      difficulty: "gold",
      icon: "👑",
      points: 200,
      requirements: [
        { type: "test_count", value: 50, description: "50 test tamamlayın" }
      ],
      unlocked: userProgress.totalTests >= 50,
      progress: userProgress.totalTests,
      maxProgress: 50,
      unlockedAt: userProgress.totalTests >= 50 ? userProgress.lastActiveDate : undefined,
      rarity: 0.8
    },
    {
      id: "chunk_collector",
      title: "Chunk Koleksiyoncusu",
      description: "Toplam 1000 chunk oluşturun",
      category: "testing",
      type: "progressive",
      difficulty: "silver",
      icon: "📦",
      points: 100,
      requirements: [
        { type: "total_chunks", value: 1000, description: "1000 chunk oluşturun" }
      ],
      unlocked: userProgress.totalChunks >= 1000,
      progress: userProgress.totalChunks,
      maxProgress: 1000,
      unlockedAt: userProgress.totalChunks >= 1000 ? userProgress.lastActiveDate : undefined,
      rarity: 0.6
    },

    // Quality Category
    {
      id: "quality_seeker",
      title: "Kalite Arayıcısı",
      description: "Ortalama kalite skorunuz %80'i geçsin",
      category: "quality",
      type: "milestone",
      difficulty: "silver",
      icon: "⭐",
      points: 60,
      requirements: [
        { type: "quality_score", value: 80, description: "Ortalama %80 kalite skoru" }
      ],
      unlocked: userProgress.averageQuality >= 0.8,
      progress: Math.round(userProgress.averageQuality * 100),
      maxProgress: 80,
      unlockedAt: userProgress.averageQuality >= 0.8 ? userProgress.lastActiveDate : undefined,
      rarity: 0.4
    },
    {
      id: "perfectionist",
      title: "Mükemmeliyetçi",
      description: "5 mükemmel skor (%95+) elde edin",
      category: "quality",
      type: "progressive",
      difficulty: "gold",
      icon: "💎",
      points: 150,
      requirements: [
        { type: "perfect_score", value: 5, description: "5 mükemmel skor" }
      ],
      unlocked: userProgress.perfectScores >= 5,
      progress: userProgress.perfectScores,
      maxProgress: 5,
      unlockedAt: userProgress.perfectScores >= 5 ? userProgress.lastActiveDate : undefined,
      rarity: 0.7
    },

    // Speed Category
    {
      id: "speed_demon",
      title: "Hız Şeytanı",
      description: "Bir testi 30 saniyeden kısa sürede tamamlayın",
      category: "speed",
      type: "milestone",
      difficulty: "gold",
      icon: "⚡",
      points: 100,
      requirements: [
        { type: "speed", value: 30, description: "30 saniyeden hızlı test" }
      ],
      unlocked: userProgress.bestSpeed > 0 && userProgress.bestSpeed <= 30,
      progress: userProgress.bestSpeed > 0 ? Math.max(0, 30 - userProgress.bestSpeed) : 0,
      maxProgress: 30,
      unlockedAt: userProgress.bestSpeed <= 30 ? userProgress.lastActiveDate : undefined,
      rarity: 0.8
    },

    // Mastery Category
    {
      id: "chunking_guru",
      title: "Chunking Gurusu",
      description: "Tüm kategorilerde başarı elde edin",
      category: "mastery",
      type: "special",
      difficulty: "platinum",
      icon: "🧙‍♂️",
      points: 500,
      requirements: [
        { type: "test_count", value: 25, description: "25 test tamamlayın" },
        { type: "quality_score", value: 85, description: "Ortalama %85 kalite" },
        { type: "scenario_complete", value: 8, description: "8 senaryo tamamlayın" }
      ],
      unlocked: userProgress.totalTests >= 25 && userProgress.averageQuality >= 0.85 && userProgress.completedScenarios.length >= 8,
      progress: Math.min(
        userProgress.totalTests / 25 + 
        (userProgress.averageQuality >= 0.85 ? 1 : userProgress.averageQuality / 0.85) + 
        userProgress.completedScenarios.length / 8, 3
      ),
      maxProgress: 3,
      unlockedAt: userProgress.totalTests >= 25 && userProgress.averageQuality >= 0.85 && userProgress.completedScenarios.length >= 8 ? userProgress.lastActiveDate : undefined,
      rarity: 0.95,
      prerequisites: ["test_veteran", "quality_seeker", "scenario_explorer"]
    },

    // Daily/Weekly
    {
      id: "daily_grind",
      title: "Günlük Çalışkan",
      description: "7 gün üst üste test yapın",
      category: "exploration",
      type: "daily",
      difficulty: "silver",
      icon: "📅",
      points: 80,
      requirements: [
        { type: "consecutive_days", value: 7, description: "7 gün üst üste aktif olun" }
      ],
      unlocked: userProgress.consecutiveDays >= 7,
      progress: userProgress.consecutiveDays,
      maxProgress: 7,
      unlockedAt: userProgress.consecutiveDays >= 7 ? userProgress.lastActiveDate : undefined,
      rarity: 0.6
    },

    // Rare Achievements
    {
      id: "early_adopter",
      title: "Erken Benimseyici",
      description: "Sistemin ilk 100 kullanıcısından biri olun",
      category: "exploration",
      type: "rare",
      difficulty: "diamond",
      icon: "🚀",
      points: 1000,
      requirements: [
        { type: "test_count", value: 1, description: "İlk testinizi yapın" }
      ],
      unlocked: false, // This would be determined by user registration order
      progress: 0,
      maxProgress: 1,
      rarity: 0.99
    }
  ];

  // Calculate user level based on total points
  const calculateLevel = (points: number): number => {
    return Math.floor(Math.sqrt(points / 100)) + 1;
  };

  // Calculate points needed for next level
  const getPointsForNextLevel = (level: number): number => {
    return Math.pow(level, 2) * 100;
  };

  const currentLevel = calculateLevel(userProgress.totalPoints);
  const nextLevelPoints = getPointsForNextLevel(currentLevel);
  const currentLevelPoints = getPointsForNextLevel(currentLevel - 1);
  const progressToNextLevel = ((userProgress.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

  // Filter achievements
  const filteredAchievements = achievements.filter(achievement => {
    const categoryMatch = selectedCategory === "all" || achievement.category === selectedCategory;
    const unlockedMatch = !showUnlockedOnly || achievement.unlocked;
    return categoryMatch && unlockedMatch;
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case "rarity":
        return b.rarity - a.rarity;
      case "points":
        return b.points - a.points;
      case "progress":
        return (b.progress / b.maxProgress) - (a.progress / a.maxProgress);
      case "category":
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "bronze": return "bg-amber-100 text-amber-800 border-amber-200";
      case "silver": return "bg-gray-100 text-gray-800 border-gray-200";
      case "gold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "platinum": return "bg-purple-100 text-purple-800 border-purple-200";
      case "diamond": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "learning": return <BookOpen className="h-4 w-4" />;
      case "testing": return <Target className="h-4 w-4" />;
      case "quality": return <Star className="h-4 w-4" />;
      case "speed": return <Zap className="h-4 w-4" />;
      case "exploration": return <Compass className="h-4 w-4" />;
      case "mastery": return <Crown className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const shareAchievement = (achievement: Achievement) => {
    if (navigator.share) {
      navigator.share({
        title: `${achievement.title} Başarısı Kazanıldı!`,
        text: `"${achievement.description}" başarısını kazandım! ${achievement.points} puan aldım.`,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      const text = `"${achievement.title}" başarısını kazandım! ${achievement.description} - ${achievement.points} puan`;
      navigator.clipboard.writeText(text);
    }
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalAchievements = achievements.length;
  const completionRate = (unlockedAchievements.length / totalAchievements) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Başarı Sistemi
        </h1>
        <p className="text-gray-600">
          İlerlemenizi takip edin ve başarılarınızı kutlayın
        </p>
      </div>

      {/* User Progress Overview */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Seviye {currentLevel} - Chunking {currentLevel <= 5 ? "Acemi" : currentLevel <= 15 ? "Uzman" : "Usta"}sı
            </span>
            <Badge className="bg-yellow-100 text-yellow-800">
              {userProgress.totalPoints} Puan
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Seviye {currentLevel + 1}'e İlerleme</span>
                <span>{Math.round(progressToNextLevel)}%</span>
              </div>
              <Progress value={progressToNextLevel} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                {nextLevelPoints - userProgress.totalPoints} puan daha gerekli
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userProgress.totalTests}</div>
                <div className="text-sm text-gray-500">Toplam Test</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(userProgress.averageQuality * 100)}%
                </div>
                <div className="text-sm text-gray-500">Ortalama Kalite</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {unlockedAchievements.length}
                </div>
                <div className="text-sm text-gray-500">Başarı Kazanıldı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {userProgress.currentStreak}
                </div>
                <div className="text-sm text-gray-500">Günlük Seri</div>
              </div>
            </div>

            {/* Achievement Completion */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Başarı Tamamlama</span>
                <span className="text-sm text-gray-600">
                  {unlockedAchievements.length} / {totalAchievements}
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="text-xs text-gray-500 text-center mt-1">
                %{Math.round(completionRate)} tamamlandı
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Başarılar
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            İlerleme
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Liderlik Tablosu
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Filtreler:</span>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="learning">Öğrenme</option>
                  <option value="testing">Test</option>
                  <option value="quality">Kalite</option>
                  <option value="speed">Hız</option>
                  <option value="exploration">Keşif</option>
                  <option value="mastery">Ustalık</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="rarity">Nadirlik</option>
                  <option value="points">Puan</option>
                  <option value="progress">İlerleme</option>
                  <option value="category">Kategori</option>
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showUnlockedOnly}
                    onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm">Sadece Kazanılanlar</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  achievement.unlocked ? "border-green-200 bg-green-50" : "border-gray-200"
                } ${selectedAchievement?.id === achievement.id ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => setSelectedAchievement(achievement)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${achievement.unlocked ? "" : "grayscale opacity-50"}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getDifficultyColor(achievement.difficulty)}>
                            {achievement.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryIcon(achievement.category)}
                            <span className="ml-1">{achievement.category}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {achievement.unlocked ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>İlerleme</span>
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Points and Rarity */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm font-medium">{achievement.points} puan</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gem className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-gray-500">
                        {achievement.rarity > 0.8 ? "Çok Nadir" : 
                         achievement.rarity > 0.6 ? "Nadir" :
                         achievement.rarity > 0.4 ? "Az Bulunur" : "Yaygın"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {achievement.unlocked && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      {enableSharing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareAchievement(achievement);
                          }}
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Paylaş
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Achievement Detail */}
          {selectedAchievement && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{selectedAchievement.icon}</div>
                    <div>
                      <CardTitle className="text-xl">{selectedAchievement.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{selectedAchievement.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAchievement(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Requirements */}
                <div>
                  <h4 className="font-medium mb-2">Gereksinimler</h4>
                  <div className="space-y-2">
                    {selectedAchievement.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {selectedAchievement.unlocked ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span>{req.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prerequisites */}
                {selectedAchievement.prerequisites && selectedAchievement.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Ön Koşullar</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAchievement.prerequisites.map((prereqId) => {
                        const prereq = achievements.find(a => a.id === prereqId);
                        return prereq ? (
                          <Badge key={prereqId} variant="outline" className="text-xs">
                            {prereq.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Rewards */}
                {selectedAchievement.rewards && selectedAchievement.rewards.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Ödüller</h4>
                    <div className="space-y-1">
                      {selectedAchievement.rewards.map((reward, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          <Gift className="h-3 w-3 inline mr-1" />
                          {reward.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unlock Date */}
                {selectedAchievement.unlockedAt && (
                  <div className="text-xs text-gray-500">
                    Kazanıldı: {new Date(selectedAchievement.unlockedAt).toLocaleDateString("tr-TR")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Kategori İlerlemesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["learning", "testing", "quality", "speed", "exploration", "mastery"].map(category => {
                    const categoryAchievements = achievements.filter(a => a.category === category);
                    const unlockedInCategory = categoryAchievements.filter(a => a.unlocked).length;
                    const progressPercent = (unlockedInCategory / categoryAchievements.length) * 100;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            <span className="text-sm font-medium capitalize">{category}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {unlockedInCategory} / {categoryAchievements.length}
                          </span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Son Aktivite</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUnlocks.length > 0 ? (
                    recentUnlocks.map((achievement, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                        <div className="text-lg">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{achievement.title}</div>
                          <div className="text-xs text-gray-500">
                            +{achievement.points} puan kazandınız
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Yeni!</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Henüz yeni başarı yok</p>
                      <p className="text-xs">Test yaparak başarı kazanmaya başlayın!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liderlik Tablosu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Liderlik tablosu yakında gelecek</p>
                <p className="text-xs">Diğer kullanıcılarla yarışın ve sıralamanızı görün</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementSystem;