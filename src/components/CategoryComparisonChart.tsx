import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import type { CategoryGap } from '@/lib/delusionalScore';
import { CATEGORIES } from '@/lib/questions';

interface CategoryComparisonChartProps {
  categories: CategoryGap[];
}

export function CategoryComparisonChart({ categories }: CategoryComparisonChartProps) {
  // Sort categories by gap size (largest to smallest)
  const sortedCategories = [...categories].sort((a, b) => b.gap - a.gap);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'self-aware':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'blind-spot':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'delusional':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'self-aware':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✓ Self-Aware
          </Badge>
        );
      case 'blind-spot':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            ⚠️ Blind Spot
          </Badge>
        );
      case 'delusional':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ❗ Delusional Zone
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Self vs. External Perception</CardTitle>
        <CardDescription>
          Compare how you see yourself with how others perceive you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Self Score</TableHead>
                <TableHead className="text-right">External Avg</TableHead>
                <TableHead className="text-right">Gap</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCategories.map((category) => {
                const categoryInfo = CATEGORIES[category.category] || {
                  color: 'bg-gray-500',
                  description: 'How you perform in this category',
                  gradient: 'from-gray-500 to-gray-600'
                };
                
                return (
                  <TableRow key={category.category}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span 
                          className={`w-3 h-3 rounded-full mr-2 ${categoryInfo.color}`}
                        />
                        {category.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{category.self_score.toFixed(0)}%</TableCell>
                    <TableCell className="text-right">{category.external_score.toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <TooltipWrapper content={`${category.gap.toFixed(1)}% difference`}>
                        <div className="flex items-center justify-end">
                          <span className="mr-2">{category.gap.toFixed(0)}%</span>
                          <Progress 
                            value={Math.min(100, category.gap * 2)} // Scale up the gap for better visibility
                            className={`h-2 w-16 ${
                              category.status === 'self-aware' 
                                ? 'bg-green-500' 
                                : category.status === 'blind-spot'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </TooltipWrapper>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        {getStatusBadge(category.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}