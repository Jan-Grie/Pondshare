import AppLogoIcon from './app-logo-icon';
import { usePage } from '@inertiajs/react';



export default function AppLogo() {
    const page = usePage();
    const appName = (page.props as any).app_name || 'Pondshare';
    return (
        <>
            
                {(page.props as any).app_logo !== "default" ? (
                        <AppLogoIcon className="size-5 fill-current text-white dark:text-black w-10 h-10" />
                ) : (
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                        <AppLogoIcon className="size-5 fill-current text-white dark:text-black w-10 h-10" />
                    </div>
                )}
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{appName}</span>
            </div>
        </>
    );
}
