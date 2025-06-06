
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Star, TrendingUp, TrendingDown, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from 'react';

interface PointTransaction {
  id: string;
  date: string;
  description: string;
  points: number; 
  type: 'earned' | 'deducted' | 'adjustment';
}

const initialPointsHistory: PointTransaction[] = [];

export default function StudentPointsPage() {
  const { user } = useAuth();
  const currentPoints = user?.points ?? 0; 
  const [pointsHistory, setPointsHistory] = useState<PointTransaction[]>(initialPointsHistory);

  useEffect(() => {
    // In a real app, fetch points history for the logged-in user
    setPointsHistory(initialPointsHistory); 
  }, [user]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Award className="text-primary h-16 w-16 mx-auto mb-3 text-yellow-500" />
          <CardTitle className="text-3xl font-headline">My Points Balance</CardTitle>
          <CardDescription className="text-5xl font-bold text-primary mt-2">{currentPoints}</CardDescription>
           <p className="text-sm text-muted-foreground">Keep track of your earned and deducted points.</p>
        </CardHeader>
        <CardContent>
            {/* Gamification elements placeholder */}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
                <History className="text-primary h-6 w-6" /> Points History
            </CardTitle>
            <CardDescription>Detailed log of your point transactions.</CardDescription>
        </CardHeader>
        <CardContent>
            {pointsHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No points history available yet.</p>
            ) : (
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead>Type</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pointsHistory.map((transaction) => (
                            <TableRow key={transaction.id}>
                            <TableCell>{transaction.date}</TableCell>
                            <TableCell className="font-medium">{transaction.description}</TableCell>
                            <TableCell className={`text-right font-semibold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                            </TableCell>
                            <TableCell>
                                {transaction.type === 'earned' && <TrendingUp className="h-5 w-5 text-green-500" title="Earned"/>}
                                {transaction.type === 'deducted' && <TrendingDown className="h-5 w-5 text-red-500" title="Deducted"/>}
                                {transaction.type === 'adjustment' && <Star className="h-5 w-5 text-blue-500" title="Adjustment"/>}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

