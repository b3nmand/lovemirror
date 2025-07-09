import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ResultsHeader } from '@/components/ResultsHeader';
import { CategoryScores } from '@/components/CategoryScores';
import { ImprovementSuggestions } from '@/components/ImprovementSuggestions';
import {
  AssessmentResult,
  generateSuggestions,
  getBadgeForScore,
  calculateBridalPrice,
  REGION_MULTIPLIERS,
  type BridalPriceResult
} from '@/lib/scores';
import { getAssessmentById } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/questions';
import { 
  Banknote, 
  Info, 
  Award, 
  Share2, 
  AlertCircle, 
  Download, 
  DollarSign, 
  Calculator, 
  ArrowRight,
  Coins
} from 'lucide-react';

export default function BridalPriceResults() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [bridalPrice, setBridalPrice] = useState<BridalPriceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseValue, setBaseValue] = useState<number>(10000);
  const [region, setRegion] = useState<string>('global');
  const [usePartnerIncome, setUsePartnerIncome] = useState<boolean>(false);
  const [partnerIncome, setPartnerIncome] = useState<number>(50000);
  const [bridalPricePercentage, setBridalPricePercentage] = useState<number>(20);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchAssessment() {
      try {
        // If we have a stored result and no ID, use that
        if (!id) {
          const storedResult = sessionStorage.getItem('assessmentResult');
          if (storedResult) {
            const parsedResult = JSON.parse(storedResult);
            setResult(parsedResult);
            
            // Calculate bridal price
            const initialBridalPrice = calculateBridalPrice(
              parsedResult.categoryScores,
              baseValue,
              region
            );
            
            setBridalPrice(initialBridalPrice);
            setLoading(false);
            return;
          }
          navigate('/assessment');
          return;
        }

        // Otherwise fetch the assessment by ID
        const { data, error } = await getAssessmentById(id);
        if (error) throw error;

        if (!data) {
          navigate('/assessment');
          return;
        }

        // Transform the data into AssessmentResult format
        const assessmentResult = {
          categoryScores: data.category_scores,
          overallScore: data.overall_score,
          overallPercentage: data.overall_percentage,
          lowestCategories: data.category_scores
            .sort((a: any, b: any) => a.percentage - b.percentage)
            .slice(0, 2),
          assessmentType: data.assessment_type,
          badge: getBadgeForScore(data.overall_percentage, data.assessment_type)
        };

        setResult(assessmentResult);
        
        // Calculate initial bridal price
        const initialBridalPrice = calculateBridalPrice(
          assessmentResult.categoryScores,
          baseValue,
          region
        );
        
        setBridalPrice(initialBridalPrice);

      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment results');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAssessment();
  }, [id, navigate, baseValue, region]);

  const handleRecalculate = () => {
    if (!result) return;
    
    let newBridalPrice;
    if (usePartnerIncome) {
      newBridalPrice = calculateBridalPrice(
        result.categoryScores,
        baseValue,
        region,
        partnerIncome,
        bridalPricePercentage
      );
    } else {
      newBridalPrice = calculateBridalPrice(
        result.categoryScores,
        baseValue,
        region
      );
    }
    
    setBridalPrice(newBridalPrice);
  };

  const handleBaseValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setBaseValue(value);
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
  };

  const handlePartnerIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setPartnerIncome(value);
    }
  };

  const handleBridalPricePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setBridalPricePercentage(Math.max(1, Math.min(100, value)));
    }
  };

  const handleShare = () => {
    // In a full implementation, this would open a sharing modal or copy to clipboard
    // For now, just show a placeholder
    alert("Share functionality will be implemented in a future update.");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
            <Button
              onClick={() => navigate('/assessment')}
              className="mt-4"
            >
              Take New Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result || !bridalPrice) return null;

  const suggestions = generateSuggestions(result.lowestCategories);

  // Prepare data for pie chart
  const pieData = Array.isArray(bridalPrice.categoryValues)
    ? bridalPrice.categoryValues.map(category => ({
    name: category.category,
    value: category.value,
    percentage: category.percentage
      }))
    : [];
  
  // Prepare data for bar chart
  const barData = Array.isArray(bridalPrice.categoryValues)
    ? bridalPrice.categoryValues.map(category => ({
    name: category.category,
    value: Math.round(category.value),
    percentage: Math.round(category.percentage)
      }))
    : [];

  // Colors for the pie chart
  const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];

  return (
    <div className="container mx-auto p-4 sm:p-6 pb-16">
      <ResultsHeader
        title="Your Bridal Price Assessment Results"
        score={result.overallPercentage}
        badge={result.badge}
        subtitle="Your cultural value assessment"
        gradientFrom="from-red-500"
        gradientTo="to-purple-500"
      />

      {/* Mobile dropdown for tabs */}
      <div className="mb-4 sm:hidden">
        <select
          value={activeTab}
          onChange={e => setActiveTab(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="overview">Bridal Price</option>
          <option value="categories">Category Breakdown</option>
          <option value="calculator">Value Calculator</option>
        </select>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6 sm:mb-8">
        {/* Desktop tab bar */}
        <TabsList className="hidden sm:grid sm:grid-cols-3 mb-4 sm:mb-6 bg-white border border-gray-200 rounded-lg">
          <TabsTrigger value="overview" className="text-sm sm:text-base">Bridal Price</TabsTrigger>
          <TabsTrigger value="categories" className="text-sm sm:text-base">Category Breakdown</TabsTrigger>
          <TabsTrigger value="calculator" className="text-sm sm:text-base">Value Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <Card className="bg-gradient-to-r from-pink-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center text-xl sm:text-2xl">
                <Coins className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-red-600" />
                Estimated Bridal Price
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Based on your assessment results and cultural factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                  {bridalPrice.totalPrice !== undefined ? `$${bridalPrice.totalPrice.toLocaleString()}` : 'N/A'}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Base value: ${baseValue.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                      >
                        {Array.isArray(pieData) && pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Value Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8">
                        {Array.isArray(barData) && barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Category Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(bridalPrice.categoryValues) && bridalPrice.categoryValues.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm sm:text-base font-medium">{category.category}</span>
                      <span className="text-sm sm:text-base">{category.value !== undefined ? `$${category.value.toLocaleString()}` : 'N/A'}</span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Adjust Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseValue" className="text-sm sm:text-base">Base Value</Label>
                  <Input
                    id="baseValue"
                    type="number"
                    value={baseValue}
                    onChange={handleBaseValueChange}
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm sm:text-base">Region</Label>
                  <Select value={region} onValueChange={handleRegionChange}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGION_MULTIPLIERS).map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-sm sm:text-base">
                          {key.charAt(0).toUpperCase() + key.slice(1)} ({value}x)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="usePartnerIncome"
                      checked={usePartnerIncome}
                      onChange={(e) => setUsePartnerIncome(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="usePartnerIncome" className="text-sm sm:text-base">
                      Use Partner Income
                    </Label>
                  </div>
                </div>

                {usePartnerIncome && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="partnerIncome" className="text-sm sm:text-base">
                        Partner Annual Income
                      </Label>
                      <Input
                        id="partnerIncome"
                        type="number"
                        value={partnerIncome}
                        onChange={handlePartnerIncomeChange}
                        className="text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bridalPricePercentage" className="text-sm sm:text-base">
                        Bridal Price Percentage
                      </Label>
                      <Input
                        id="bridalPricePercentage"
                        type="number"
                        value={bridalPricePercentage}
                        onChange={handleBridalPricePercentageChange}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleRecalculate}
                  className="w-full bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
                >
                  Recalculate
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full sm:w-auto text-sm sm:text-base"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
        <Button
          onClick={() => navigate('/assessment')}
          className="w-full sm:w-auto bg-white text-gray-900 border border-gray-200 hover:text-purple-600 hover:border-pink-300 focus:border-2 focus:border-pink-500 focus:text-pink-700 transition-all"
        >
          Take New Assessment
        </Button>
      </div>
    </div>
  );
}