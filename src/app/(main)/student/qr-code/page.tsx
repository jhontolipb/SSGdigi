
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export default function StudentQRCodePage() {
  const { user, allDepartments, fetchDepartments, loading: authLoading } = useAuth();
  const [departmentName, setDepartmentName] = useState('N/A');

  useEffect(() => {
    if (allDepartments.length === 0 && !authLoading) {
      fetchDepartments();
    }
  }, [allDepartments, authLoading, fetchDepartments]);

  useEffect(() => {
    if (user && user.departmentID && allDepartments.length > 0) {
      const dept = allDepartments.find(d => d.id === user.departmentID);
      setDepartmentName(dept ? dept.name : 'N/A (Unknown Dept ID)');
    } else if (user && !user.departmentID) {
      setDepartmentName('N/A');
    }
  }, [user, allDepartments]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'student' || !user.qrCodeID) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>QR Code Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your QR code is not available at the moment. This could be because you are not registered as a student or your QR ID has not been generated. Please contact support if this persists.</p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = () => {
    if (!user?.qrCodeID) return;
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(user.qrCodeID)}&format=png`;
    link.download = `${user.fullName}_QRCode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!user?.qrCodeID || !user.fullName) return;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(user.qrCodeID)}`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(\`
            <html>
                <head>
                    <title>Print QR Code - \${user.fullName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
                        img { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
                        h1 { font-size: 24px; }
                        p { font-size: 16px; }
                    </style>
                </head>
                <body>
                    <h1>\${user.fullName}</h1>
                    <p>Student ID: (Your Student ID Here - Not in current data model)</p>
                    <p>Department: \${departmentName}</p>
                    <img src="\${qrCodeUrl}" alt="Student QR Code" />
                    <p>QR Code ID: \${user.qrCodeID}</p>
                    <script>
                        window.onload = function() {
                            window.print();
                            // window.close(); // Optional: close window after print dialog
                        }
                    <\/script>
                </body>
            </html>
        \`);
        printWindow.document.close();
    } else {
        alert("Could not open print window. Please check your browser's pop-up settings.");
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline flex items-center justify-center gap-2">
            <QrCode className="text-primary h-7 w-7" /> My QR Code ID
          </CardTitle>
          <CardDescription>Use this QR code for event attendance.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
            <Image
              src={\`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=\${encodeURIComponent(user.qrCodeID)}\`}
              alt="Student QR Code"
              width={250}
              height={250}
              data-ai-hint="QR code attendance"
              className="rounded-md shadow-md border"
            />
          </div>
          <div>
            <p className="font-semibold text-lg">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">Department: {departmentName}</p>
            <p className="text-xs text-muted-foreground mt-1">QR ID: {user.qrCodeID}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download QR
            </Button>
            <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90">
              <Printer className="mr-2 h-4 w-4" /> Print QR
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Present this QR code to the Officer-in-Charge (OIC) at events for attendance scanning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
    
