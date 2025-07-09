import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { CATEGORIES } from '@/lib/questions';
import { getAssessorForAssessment } from '@/lib/externalAssessments';
import type { ExternalAssessmentResult } from '@/lib/externalAssessments';

interface RaterBreakdownProps {
  assessments: ExternalAssessmentResult[];
  onSelectAssessment: (assessment: ExternalAssessmentResult) => void;
}

export function RaterBreakdown({ assessments, onSelectAssessment }: RaterBreakdownProps) {
  const [expanded, setExpanded] = useState(false);
  const [raterGroups, setRaterGroups] = useState<Record<string, ExternalAssessmentResult[]>>({});
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    async function groupAssessmentsByRelationship() {
      const groups: Record<string, ExternalAssessmentResult[]> = {
        all: assessments
      };
      
      // Group assessments by relationship type
      for (const assessment of assessments) {
        const { relationship } = await getAssessorForAssessment(assessment.assessor_id);
        
        if (!groups[relationship]) {
          groups[relationship] = [];
        }
        
        groups[relationship].push(assessment);
      }
      
      setRaterGroups(groups);
      
      // Set the first relationship type as the active tab if there's more than just 'all'
      const tabs = Object.keys(groups).filter(tab => tab !== 'all');
      if (tabs.length > 0) {
        setActiveTab(tabs[0]);
      }
    }
    
    if (assessments.length > 0) {
      groupAssessmentsByRelationship();
    }
  }, [assessments]);

  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No external assessments available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleExpanded = () => setExpanded(!expanded);

  // Calculate average scores for each category by group
  const calculateGroupAverages = (group: ExternalAssessmentResult[]) => {
    const categoryAverages: Record<string, {
      totalScore: number;
      totalPercentage: number;
      count: number;
    }> = {};
    
    group.forEach(assessment => {
      assessment.category_scores.forEach((category: any) => {
        if (!categoryAverages[category.category]) {
          categoryAverages[category.category] = {
            totalScore: 0,
            totalPercentage: 0,
            count: 0
          };
        }
        
        categoryAverages[category.category].totalScore += category.score;
        categoryAverages[category.category].totalPercentage += category.percentage;
        categoryAverages[category.category].count += 1;
      });
    });
    
    return Object.entries(categoryAverages).map(([category, data]) => ({
      category,
      averageScore: data.totalScore / data.count,
      averagePercentage: data.totalPercentage / data.count
    }));
  };

  const groupTabs = Object.keys(raterGroups).filter(key => key !== 'all' && raterGroups[key].length > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Breakdown by Rater Type
            </CardTitle>
            <CardDescription>
              How different people in your life perceive you
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent>
          {groupTabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                {groupTabs.map(tab => (
                  <TabsTrigger key={tab} value={tab} className="capitalize">
                    {tab}s ({raterGroups[tab].length})
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {groupTabs.map(tab => (
                <TabsContent key={tab} value={tab}>
                  {calculateGroupAverages(raterGroups[tab]).map(category => {
                    const categoryInfo = CATEGORIES[category.category] || {
                      color: 'bg-gray-500',
                      gradient: 'from-gray-500 to-gray-600'
                    };
                    
                    return (
                      <div key={category.category} className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center">
                            <span 
                              className={`w-3 h-3 rounded-full mr-2 ${categoryInfo.color}`}
                            />
                            <span>{category.category}</span>
                          </div>
                          <span>{category.averagePercentage.toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={category.averagePercentage} 
                          className={`h-2 ${categoryInfo.gradient ? `bg-gradient-to-r ${categoryInfo.gradient}` : ''}`}
                        />
                      </div>
                    );
                  })}
                  
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectAssessment(raterGroups[tab][0])}
                    >
                      View Individual Results
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Not enough data to group by relationship type.</p>
            </div>
          )}
        </CardContent>
      )}
      
      <CardFooter className={expanded ? "pt-0" : "pt-2"}>
        <p className="text-xs text-muted-foreground w-full text-center">
          Results are anonymized and grouped by relationship type
        </p>
      </CardFooter>
    </Card>
  );
}