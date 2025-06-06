
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { PredefinedDepartments } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

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
  
  const departmentName = PredefinedDepartments.find(d => d.id === user.departmentID)?.name || 'N/A';

  const onPasswordSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    if (!user) return;
    setIsPasswordChanging(true);
    const result = await changePassword(user.userID, values.currentPassword, values.newPassword);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsPasswordChanging(false);
  };

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
          
          {user.role === 'student' && user.departmentID && (
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

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
               <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <KeyRound className="mr-2 h-4 w-4" /> Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Your Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and a new password.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)} disabled={isPasswordChanging}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isPasswordChanging} className="bg-primary hover:bg-primary/90">
                          {isPasswordChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Password
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>


          {user.role === 'student' && user.qrCodeID && (
            <>
              <Separator />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">My QR Code ID</h3>
                <div className="flex justify-center">
                  <Image 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(user.qrCodeID)}`} 
                    alt="Student QR Code" 
                    width={200} 
                    height={200}
                    data-ai-hint="QR code"
                    className="rounded-md shadow-md" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">QR Code ID: {user.qrCodeID}</p>
                <Button variant="outline" onClick={() => alert("Download QR functionality to be implemented.")}>
                  Download QR Code
                </Button>
              </div>
            </>
          )}
          
          <Button className="w-full mt-4" disabled>Update Profile Details (Not implemented)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
