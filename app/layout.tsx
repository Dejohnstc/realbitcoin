import "./globals.css";
import InvestorPopup from "@/components/InvestorPopup";
import { NotificationProvider } from "@/context/NotificationContext";
import ChatWrapper from "@/components/ChatWrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          {/* ✅ MAIN APP */}
          {children}
<ChatWrapper/>
          {/* ✅ GLOBAL COMPONENTS */}
          <InvestorPopup />
        
        </NotificationProvider>
      </body>
    </html>
  );
}