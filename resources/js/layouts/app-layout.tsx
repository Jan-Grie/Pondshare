import { type ReactNode } from "react";
import { type BreadcrumbItem } from "@/types";
import AppLayoutSidebar from "@/layouts/app/app-sidebar-layout";
import AppLayoutTopnav from "@/layouts/app/app-header-layout";
import { Toaster } from "@/components/ui/sonner";

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    user?: {
        settings?: {
            layout?: "sidebar" | "topnav";            
        };
    };
}

export default function AppLayout({ children, breadcrumbs, user, ...props }: AppLayoutProps) {
    const layout = user?.settings?.layout ?? "topnav";
    
    const LayoutComponent =
        layout === "sidebar"
            ? AppLayoutSidebar      
            : AppLayoutTopnav;      

    return (
        <LayoutComponent breadcrumbs={breadcrumbs} {...props}>
            {children}
            <Toaster />
        </LayoutComponent>
    );
}


// import AppLayoutTemplate from '@/layouts/app/app-header-layout';
// import { type BreadcrumbItem } from '@/types';
// import { type ReactNode } from 'react';
// import { Toaster } from "@/components/ui/sonner"


// interface AppLayoutProps {
//     children: ReactNode;
//     breadcrumbs?: BreadcrumbItem[];
// }

// export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
//     <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
//         {children}
//         <Toaster />
//     </AppLayoutTemplate>
// );
