/**
 * React screen – Compatibility results
 * ------------------------------------
 * – Loads the user's active relationship and the latest compatibility score
 * – Allows the user to trigger a fresh calculation
 * – No longer reloads the page – state updates are enough
 */
import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Users } from 'lucide-react';
import { getBadgeForScore } from '@/lib/scores';
import { CATEGORIES } from '@/lib/questions';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

interface CategoryMatch {
  category: string;
  user1_score: number;
  user2_score: number;
  normalized_user1: number;
  normalized_user2: number;
  compatibility_percentage: number;
}

interface CompatibilityScore {
  id: string;
  overall_percentage: number;
  category_scores: CategoryMatch[];
  analysis_date: string;
}

// Example brand colors
const BRAND_GRADIENT = "linear-gradient(90deg, #e75480 0%, #a259f7 100%)";
const BRAND_ACCENT = "#e75480";
const BRAND_BG = "#f9f6ff";

// Example icons
const Trophy = () => <span role="img" aria-label="Trophy">🏆</span>;
const Magnifier = () => <span role="img" aria-label="Magnifier">🔍</span>;
const Lightbulb = () => <span role="img" aria-label="Lightbulb">💡</span>;

const CompatibilityResults: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allScores, setAllScores] = useState<CompatibilityScore[]>([]);
  const [selectedTab, setSelectedTab] = useState("score");

  // Fetch helpers
  const fetchRelationship = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthenticated");
    const { data, error } = await supabase
      .from("relationships")
      .select("id")
      .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
      .eq("status", "active")
      .single();
    if (error || !data) throw error || new Error("No active relationship");
    return data.id as string;
  };

  const fetchAllCompatibilityScores = async (relId: string) => {
    const { data, error } = await supabase
      .from("compatibility_scores")
      .select("*")
      .eq("relationship_id", relId)
      .order("analysis_date", { ascending: false });
    if (error) throw error;
    return data as CompatibilityScore[];
  };

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const relId = await fetchRelationship();
        let scores: CompatibilityScore[] = [];
        try {
          scores = await fetchAllCompatibilityScores(relId);
        } catch (fetchErr) {
          // If not found, scores will remain empty
        }
        if (!scores.length) {
          // No score exists, so trigger calculation
          console.log('Calling calculate_compatibility_score with rel_id:', relId);
          const { error } = await supabase.rpc('calculate_compatibility_score', {
            rel_id: relId,
          });
          if (error) throw error;
          // Fetch the new score after calculation
          scores = await fetchAllCompatibilityScores(relId);
        }
        setAllScores(scores);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Trigger recalculation
  const handleRecalculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const relId = await fetchRelationship();
      console.log('Calling calculate_compatibility_score with rel_id:', relId);
      const { error } = await supabase.rpc('calculate_compatibility_score', {
        rel_id: relId,
      });
      if (error) throw error;
      const scores = await fetchAllCompatibilityScores(relId);
      setAllScores(scores);
    } catch (err: any) {
      setError(err.message || "Recalculation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Local summary calculation
  const getSummary = () => {
    if (!allScores || !Array.isArray(allScores) || !allScores.length) return null;
    const latest = allScores[0];
    if (!latest || !latest.category_scores || !Array.isArray(latest.category_scores)) {
      console.warn('[CompatibilityResults] Invalid latest score data:', latest);
      return null;
    }
    return {
      overall: latest.overall_percentage,
      categories: latest.category_scores,
      analyzedDate: latest.analysis_date,
      count: allScores.length
    };
  };

  useEffect(() => {
    console.log('allScores:', allScores);
  }, [allScores]);

  if (loading) return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );

  if (!allScores || !Array.isArray(allScores) || !allScores.length) {
    console.log('Nothing to display: allScores =', allScores);
    return null;
  }

  const summary = getSummary();
  console.log('summary:', summary);

  // Label and color for overall compatibility
  const getCompatibilityLabel = (score: number) => {
    if (score <= 50) return { label: 'Needs Work', color: 'text-red-600' };
    if (score <= 80) return { label: 'Some Alignment', color: 'text-yellow-600' };
    return { label: 'Highly Compatible', color: 'text-green-600' };
  };
  const overallLabel = getCompatibilityLabel(summary?.overall ?? 0);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8" style={{
        background: 'linear-gradient(90deg, #e75480 0%, #a259f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Compatibility Results
        </h1>
      {/* Mobile dropdown for tabs */}
      <div className="mb-4 sm:hidden">
        <select
          value={selectedTab}
          onChange={e => setSelectedTab(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="score">Compatibility Score</option>
          <option value="summary">Summary</option>
          <option value="history">History</option>
        </select>
      </div>
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6 sm:mb-8">
        {/* Desktop tab bar */}
        <TabsList className="hidden sm:grid sm:grid-cols-3 mb-4 sm:mb-6 bg-white border border-gray-200 rounded-lg">
          <TabsTrigger value="score" className="text-sm sm:text-base">Compatibility Score</TabsTrigger>
          <TabsTrigger value="summary" className="text-sm sm:text-base">Summary</TabsTrigger>
          <TabsTrigger value="history" className="text-sm sm:text-base">History</TabsTrigger>
        </TabsList>

        <TabsContent value="score">
          {summary && (
            <Card className="mb-8">
        <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Your Compatibility
                </CardTitle>
                <CardDescription>
                  Combined results from {summary.count} compatibility {summary.count === 1 ? 'assessment' : 'assessments'}
          </CardDescription>
        </CardHeader>
        <CardContent>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="text-5xl font-bold mb-2">
                    {Math.round(summary.overall)}%
          </div>
                  <div className={`text-xl font-semibold ${overallLabel.color} mb-2`}>
                    {overallLabel.label}
                </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Compatibility Score
                  </p>
              </div>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {Array.isArray(summary?.categories) && summary.categories.map((cat) => {
              if (!cat || typeof cat !== 'object') {
                console.warn('[CompatibilityResults] Invalid category data:', cat);
                return null;
              }
              // Case-insensitive category lookup
              const categoryInfo = CATEGORIES[
                Object.keys(CATEGORIES).find(
                  key => key.toLowerCase() === String(cat.category).toLowerCase()
                )
              ] || {
                    color: 'bg-gray-500',
                    description: 'How you perform in this category',
                    gradient: 'from-gray-500 to-gray-600'
                  };
              // Logging for debugging
              if (typeof cat.compatibility_percentage !== 'number' || isNaN(cat.compatibility_percentage)) {
                console.warn('[CompatibilityResults] compatibility_percentage is invalid for category', cat.category, cat);
              }
                  return (
                <Card key={cat.category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${categoryInfo?.color || 'bg-gray-500'}`} />
                      {cat.category}
                    </CardTitle>
                    <CardDescription>
                      {categoryInfo.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">You: {cat.user1_score}/50 ({Math.round(cat.normalized_user1 * 100)}%)</span>
                        <span className="text-muted-foreground">Partner: {cat.user2_score}/50 ({Math.round(cat.normalized_user2 * 100)}%)</span>
                      </div>
                      <Progress value={cat.compatibility_percentage} className={`h-2 ${categoryInfo?.gradient ? `bg-gradient-to-r ${categoryInfo.gradient}` : ''}`} />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Match: {typeof cat.compatibility_percentage === 'number' && !isNaN(cat.compatibility_percentage) ? cat.compatibility_percentage.toFixed(1) : (console.warn('[CompatibilityResults] compatibility_percentage undefined or NaN for', cat), 'N/A')}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  );
                })}
              </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Compatibility History</CardTitle>
              <CardDescription>
                View all previous compatibility results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Overall %</TableHead>
                      <TableHead>Categories</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(allScores) && allScores.map(score => (
                      <TableRow key={score.id}>
                        <TableCell>{new Date(score.analysis_date).toLocaleDateString()}</TableCell>
                        <TableCell>{Math.round(score.overall_percentage)}%</TableCell>
                        <TableCell>
                          {Array.isArray(score.category_scores) && score.category_scores.map(cat => (
                            <span key={cat.category} className="mr-2">
                              {cat.category}: {typeof cat.compatibility_percentage === 'number' && !isNaN(cat.compatibility_percentage) ? cat.compatibility_percentage.toFixed(1) : (console.warn('[CompatibilityResults] compatibility_percentage undefined or NaN in history for', cat), 'N/A')}%
                            </span>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-center mt-8">
        <Button onClick={handleRecalculate} variant="outline">
          Recalculate Compatibility
        </Button>
        </div>
    </div>
  );
};

export default CompatibilityResults;