import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { usePublicEmployee } from "@/hooks/use-employees";
import { useTrackCardView } from "@/hooks/use-analytics";
import { QRCodeSVG } from "qrcode.react";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Linkedin, 
  Globe, 
  Download, 
  QrCode,
  MapPin,
  Building2,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function NameCard() {
  const [match, params] = useRoute("/:id");
  const id = params?.id || "";
  const [source, setSource] = useState<'qr' | 'nfc' | 'direct' | 'unknown'>('unknown');
  
  const { data: employee, isLoading, isError } = usePublicEmployee(id);
  const { mutate: trackView } = useTrackCardView();

  useEffect(() => {
    if (match && id) {
      // Parse source from URL
      const urlParams = new URLSearchParams(window.location.search);
      const src = urlParams.get('src') as any;
      const validSources = ['qr', 'nfc', 'direct'];
      const finalSource = validSources.includes(src) ? src : 'direct';
      setSource(finalSource);

      // Track view
      trackView({ employeeId: id, source: finalSource });
    }
  }, [match, id, trackView]);

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-6 text-muted-foreground font-medium animate-pulse">Loading Profile...</p>
      </div>
    );
  }

  if (isError || !employee || !employee.isActive) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <Share2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">Card Not Found</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">
          The digital name card you are looking for doesn't exist or is currently inactive.
        </p>
      </div>
    );
  }

  const handleDownloadVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:${employee.fullName};;;;
FN:${employee.fullName}
ORG:${employee.companyName};${employee.department}
TITLE:${employee.position}
TEL;type=WORK;type=VOICE:${employee.phone}
${employee.phoneExt ? `TEL;type=WORK;type=VOICE:${employee.phoneExt}` : ''}
EMAIL;type=WORK;type=INTERNET:${employee.email}
URL:${employee.websiteUrl || ''}
${employee.address ? `ADR;type=WORK:;;${employee.address};;;;` : ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${employee.fullName.replace(/\s+/g, '_')}_Contact.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${employee.fullName.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const currentUrl = window.location.origin + `/${employee.id}`;
  
  // Safe avatar fallback
  const avatarSrc = employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=1a3a5c&color=fff&size=256`;

  return (
    <div className="min-h-screen bg-background sm:bg-muted/30 pb-12 sm:py-12 flex justify-center">
      {/* Mobile Card Container */}
      <div className="w-full max-w-[420px] bg-card sm:rounded-3xl sm:shadow-xl sm:border border-border/50 overflow-hidden relative flex flex-col min-h-[100dvh] sm:min-h-0">
        
        {/* Top Hero Section */}
        <div className="relative h-48 bg-hero-pattern flex items-center justify-center p-6">
          {employee.companyLogoUrl && (
            <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md rounded-lg p-2 max-w-[100px]">
              <img src={employee.companyLogoUrl} alt="Company Logo" className="h-6 object-contain" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="px-6 pb-8 relative flex-1 flex flex-col">
          
          {/* Avatar (Overlapping) */}
          <div className="relative -mt-20 flex justify-center mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-card bg-card shadow-lg overflow-hidden">
              <img 
                src={avatarSrc} 
                alt={employee.fullName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName)}&background=1a3a5c&color=fff&size=256`; }}
              />
            </div>
          </div>

          {/* Profile Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              {employee.fullName}
            </h1>
            <p className="text-base font-semibold text-primary mb-1">
              {employee.position}
            </p>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground font-medium">
              <Building2 className="w-4 h-4" />
              <span>{employee.companyName} • {employee.department}</span>
            </div>
          </div>

          {/* Quick Actions Circular Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <a href={`tel:${employee.phone}`} className="flex flex-col items-center gap-2 group hover-elevate">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Phone className="w-5 h-5" />
              </div>
            </a>
            
            <a href={`mailto:${employee.email}`} className="flex flex-col items-center gap-2 group hover-elevate">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Mail className="w-5 h-5" />
              </div>
            </a>
            
            {employee.zaloPhone && (
              <a href={`https://zalo.me/${employee.zaloPhone}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group hover-elevate">
                <div className="w-12 h-12 rounded-full bg-[#0068FF]/10 text-[#0068FF] flex items-center justify-center group-hover:bg-[#0068FF] group-hover:text-white transition-all duration-300">
                  <MessageCircle className="w-5 h-5" />
                </div>
              </a>
            )}
            
            {employee.linkedinUrl && (
              <a href={employee.linkedinUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group hover-elevate">
                <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] flex items-center justify-center group-hover:bg-[#0A66C2] group-hover:text-white transition-all duration-300">
                  <Linkedin className="w-5 h-5" />
                </div>
              </a>
            )}

            {employee.websiteUrl && (
              <a href={employee.websiteUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group hover-elevate">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Globe className="w-5 h-5" />
                </div>
              </a>
            )}
          </div>

          {/* Contact Details List */}
          <div className="space-y-4 mb-8 bg-muted/30 p-4 rounded-2xl border border-border/50">
            <a href={`tel:${employee.phone}`} className="flex items-center gap-4 p-2 rounded-xl hover:bg-card hover:shadow-sm transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-primary flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Mobile</p>
                <p className="text-sm font-semibold text-foreground truncate">{employee.phone}</p>
              </div>
            </a>
            
            <a href={`mailto:${employee.email}`} className="flex items-center gap-4 p-2 rounded-xl hover:bg-card hover:shadow-sm transition-all duration-200">
              <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-primary flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm font-semibold text-foreground truncate">{employee.email}</p>
              </div>
            </a>

            {employee.address && (
              <div className="flex items-center gap-4 p-2 rounded-xl hover:bg-card hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center text-primary flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Office</p>
                  <p className="text-sm font-semibold text-foreground break-words">{employee.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Primary Actions */}
          <div className="mt-auto space-y-3">
            <Button 
              onClick={handleDownloadVCard}
              className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Download className="mr-2 w-5 h-5" />
              Save Contact
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-base font-bold rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 transition-all"
                >
                  <QrCode className="mr-2 w-5 h-5" />
                  Show QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-center font-display text-xl">Share Contact</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 mb-6">
                    <QRCodeSVG 
                      id="qr-canvas"
                      value={`${currentUrl}?src=qr`} 
                      size={200}
                      level={"H"}
                      includeMargin={true}
                      imageSettings={{
                        src: employee.companyLogoUrl || "",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground mb-6 max-w-[250px]">
                    Scan this QR code with any smartphone camera to open {employee.fullName.split(' ')[0]}'s contact card.
                  </p>
                  <Button onClick={handleDownloadQR} variant="secondary" className="w-full rounded-xl font-semibold">
                    <Download className="mr-2 w-4 h-4" /> Download QR
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        </div>
      </div>
    </div>
  );
}
