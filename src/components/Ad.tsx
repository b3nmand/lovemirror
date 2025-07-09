import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function Ad() {
  return (
    <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Premium Features</h3>
        <p className="text-sm">Unlock advanced insights and personalized coaching</p>
      </CardContent>
    </Card>
  );
}