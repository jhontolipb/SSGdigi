
"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
// import { PredefinedDepartments } from "@/contexts/AuthContext"; // Removed
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
  const { user, changePassword: authChangePassword, loading: authLoading, allDepartments, fetchDepartments } = useAuth();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [departmentName, setDepartmentName] = useState('N/A');

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (allDepartments.length === 0) {
      fetchDepartments(); // Fetch if not already loaded by context
    }
  }, [allDepartments, fetchDepartments]);

  useEffect(() => {
    if (user && user.departmentID && allDepartments.length > 0) {
      const dept = allDepartments.find(d => d.id === user.departmentID);
      setDepartmentName(dept ? dept.name : 'N/A (Unknown Dept ID)');
    } else if (user && !user.departmentID) {
      setDepartmentName('N/A');
    }
  }, [user, allDepartments]);


  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 0 || names[0] === "") return "?";
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const onPasswordSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    if (!user) return;
    setIsPasswordChanging(true);
    const result = await authChangePassword(values.currentPassword, values.newPassword);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setIsPasswordDialogOpen(false);
      passwordForm.reset();
    } else {
      // toast for failure is handled by authChangePassword or here if specific form error needed
      // passwordForm.setError("currentPassword", { type: "manual", message: result.message }); // Example
    }
    setIsPasswordChanging(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center items-center">
          <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
            <AvatarImage src={`https://placehold.co/150x150.png?text=${getInitials(user.fullName)}`} alt={user.fullName} data-ai-hint="profile picture" />
            <AvatarFallback className="text-3xl">{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{user.fullName}</CardTitle>
          <CardDescription className="capitalize">{user.role.replace('_', ' ')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} readOnly disabled className="mt-1"/>
          </div>

          {user.role === 'student' && (
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={departmentName} readOnly disabled className="mt-1"/>
            </div>
          )}

          {user.role === 'student' && user.points !== undefined && (
            <div>
              <Label htmlFor="points">Points</Label>
              <Input id="points" value={user.points.toString()} readOnly disabled className="mt-1"/>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Button className="w-full" disabled>Update Profile Details (Not Implemented)</Button>
        </CardFooter>
      </Card>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl">Account Settings</CardTitle>
            <CardDescription>Manage your account preferences.</CardDescription>
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
        <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl">My QR Code</CardTitle>
                <CardDescription>Use this QR code for event attendance and identification.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
            <div className="flex justify-center">
                <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(user.qrCodeID)}`}
                alt="Student QR Code"
                width={200}
                height={200}
                data-ai-hint="QR code"
                className="rounded-md shadow-md border"
                />
            </div>
            <p className="text-sm text-muted-foreground pt-2">QR Code ID: {user.qrCodeID}</p>
            <Button variant="outline" onClick={() => alert("Download QR functionality to be implemented.")} disabled>
                Download QR Code (Not Impl.)
            </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
