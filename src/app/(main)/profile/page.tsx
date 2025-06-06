
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { PredefinedDepartments } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <p>Loading user profile...</p>;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };
  
  const departmentName = PredefinedDepartments.find(d => d.id === user.departmentId)?.name || 'N/A';

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
            <AvatarImage src={`https://placehold.co/150x150.png?text=${getInitials(user.fullName)}`} alt={user.fullName} data-ai-hint="profile picture" />
            <AvatarFallback className="text-3xl">{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{user.fullName}</CardTitle>
          <CardDescription className="capitalize">{user.role.replace('_', ' ')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} readOnly disabled />
          </div>
          
          {user.role === 'student' && user.departmentId && (
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={departmentName} readOnly disabled />
            </div>
          )}

          {user.role === 'student' && user.points !== undefined && (
            <div>
              <Label htmlFor="points">Points</Label>
              <Input id="points" value={user.points.toString()} readOnly disabled />
            </div>
          )}

          <Separator />

          {user.role === 'student' && user.qrCodeId && (
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">My QR Code ID</h3>
              <div className="flex justify-center">
                <Image 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(user.qrCodeId)}`} 
                  alt="Student QR Code" 
                  width={200} 
                  height={200}
                  data-ai-hint="QR code"
                  className="rounded-md shadow-md" 
                />
              </div>
              <p className="text-sm text-muted-foreground">QR Code ID: {user.qrCodeId}</p>
              <Button variant="outline" onClick={() => alert("Download QR functionality to be implemented.")}>
                Download QR Code
              </Button>
            </div>
          )}
          
          <Button className="w-full mt-4" disabled>Update Profile (Not implemented)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
