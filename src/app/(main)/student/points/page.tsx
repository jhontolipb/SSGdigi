
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Star, TrendingUp, TrendingDown, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock Data
interface PointTransaction {
  id: string;
  date: string;
  description: string;
  points: number; // Positive for earned, negative for deducted
  type: 'earned' | 'deducted' | 'adjustment';
}

const mockPointsHistory: PointTransaction[] = [
  { id: 'tx1', date: '2024-09-01', description: 'Participation: SSG Orientation', points: 10, type: 'earned' },
  { id: 'tx2', date: '2024-08-25', description: 'Volunteering: Campus Clean-up', points: 20, type: 'earned' },
  { id: 'tx3', date: '2024-08-15', description: 'Sanction: Missed Club Meeting', points: -5, type: 'deducted' },
  { id: 'tx4', date: '2024-07-30', description: 'Academic Achievement Award', points: 50, type: 'earned' },
  { id: 'tx5', date: '2024-07-20', description: 'Late Submission Penalty', points: -10, type: 'deducted' },
];

export default function StudentPointsPage() {
  const { user } = useAuth();
  const currentPoints = user?.points ?? 0; // Get points from auth context or default to 0

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
            {/* Could add some gamification elements here like progress to next reward tier */}
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
            {mockPointsHistory.length === 0 ? (
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
                        {mockPointsHistory.map((transaction) => (
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

