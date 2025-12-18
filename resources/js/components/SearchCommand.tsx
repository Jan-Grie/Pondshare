"use client";

import { useEffect, useMemo, useState } from "react";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandDialog } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Folder, LayoutGrid, FileChartPie, Trash2, Loader2, Users, Link2 } from "lucide-react";
import { Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { getFileIconPath } from "@/lib/getIconPath"

type SearchResult = {
    ponds: Array<{ id: number; name: string }>;
    files: Array<{ id: number; name: string; extension: string; pond_id: number; pond_name?: string }>;
    links: Array<{ id: number; title?: string; pond_id: number; pond_name?: string }>;
    upload_links: Array<{ id: number; title?: string; pond_id: number; pond_name?: string }>;
    users: Array<{ id: number; name: string; email: string }>;
};

type SearchCommandProps = {
    className?: string;
};


export function SearchCommand({ className }: SearchCommandProps) {
    const [open, setOpen] = useState(false);
    const [term, setTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult>({
        ponds: [],
        files: [],
        links: [],
        upload_links: [],
        users: [],        
    });
    const { t } = useTranslation();

    //Debounce (250ms)
    const debounceTerm = useMemo(() => term, [term]);
    useEffect(() => {
        const id = setTimeout(() => {
            if(debounceTerm.trim().length < 2){
                setResults({ ponds: [], files: [], links: [], upload_links: [], users: [] });
                setLoading(false);
                return;
            }
            setLoading(true);
            fetch(`/search?query=${encodeURIComponent(debounceTerm)}`, {
                headers: {Accept: "application/json"},
                credentials: "same-origin",
            })
            .then((res) => res.json())
            .then((data: SearchResult) => setResults(data))
            .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(id);
    }, [debounceTerm]);

    const hasAny = 
        results.ponds.length ||
        results.files.length ||
        results.links.length ||
        results.upload_links.length ||
        results.users.length;

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            // Ignore if focused on input elements
            const target = e.target as HTMLElement;
            const isInput =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.getAttribute("contenteditable") === "true";

            if (isInput) return;

            // Cmd+K (Mac) / Ctrl+K (Win/Linux)
            if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    return (
        <div className={className}>
            <Button variant="ghost" className="group h-9 w-9 cursor-pointer" onClick={() => setOpen(true)}>
                <Search className="!size-5 opacity-80 group-hover:opacity-100"/>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>                
                    <Command shouldFilter={false}>
                        <CommandInput 
                            value={term}
                            onValueChange={setTerm}
                            placeholder={t("common:search.placeholder")} 
                        />

                        <CommandList>
                            {loading && (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {t("common:search.loading")}
                                </div>
                            )}

                            {!loading && !hasAny &&
                                <CommandEmpty>{t("common:search.no_results")}</CommandEmpty>
                            }

                            {results.ponds.length > 0 && (
                                <CommandGroup heading={t("common:search.sections.ponds")}>
                                {results.ponds.map((p) => (
                                    <CommandItem
                                        key={`pond-${p.id}`}
                                        value={`pond-${p.id}-${p.name}`}
                                        asChild
                                        onSelect={() => setOpen(false)}
                                        
                                    >
                                    <Link href={`/ponds/${p.id}`} className="cursor-pointer">
                                        <Folder className="mr-2 h-4 w-4" />
                                        {p.name}
                                    </Link>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            )}

                            {/* Files */}
                            {results.files.length > 0 && (
                                <CommandGroup heading={t("common:search.sections.files")}>
                                {results.files.map((f) => (
                                    <CommandItem key={`file-${f.id}`} asChild onSelect={() => setOpen(false)}>
                                    <Link href={`/ponds/${f.pond_id}?file=${encodeURIComponent(`${f.name}.${f.extension}`)}`} className="cursor-pointer">
                                        <img src={getFileIconPath(f.extension)} alt="File Icon" className="mr-2 h-6 w-6" />
                                        {f.name}{f.extension ? `.${f.extension}` : ""}
                                        {f.pond_name ? ` · ${f.pond_name}` : ""}
                                    </Link>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            )}

                            {/* Links */}
                            {results.links.length > 0 && (
                                <CommandGroup heading={t("common:search.sections.links")}>
                                {results.links.map((l) => (
                                    <CommandItem key={`link-${l.id}`} asChild onSelect={() => setOpen(false)}>
                                    <Link href={`/ponds/${l.pond_id}?share_link=${encodeURIComponent(l.title || "")}`} className="cursor-pointer">
                                        <Link2 className="mr-2 h-4 w-4" />
                                        {l.title || t("common:search.items.link")}
                                        {l.pond_name ? ` · ${l.pond_name}` : ""}
                                    </Link>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            )}

                            {/* Upload Links */}
                            {results.upload_links.length > 0 && (
                                <CommandGroup heading={t("common:search.sections.upload_links")}>
                                {results.upload_links.map((l) => (
                                    <CommandItem key={`upload-link-${l.id}`} asChild onSelect={() => setOpen(false)}>
                                    <Link href={`/ponds/${l.pond_id}?upload_link=${encodeURIComponent(l.title || "")}`} className="cursor-pointer">
                                        <Link2 className="mr-2 h-4 w-4" />
                                        {l.title || t("common:search.items.upload_link")}
                                        {l.pond_name ? ` · ${l.pond_name}` : ""}
                                    </Link>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            )}

                            {/* Users */}
                            {/* //TODO => Routing anpassen für Nutzer. -> Gibt es derzeit nicht, aber sobald verfügbar mit E-Mail in URL als Filter*/ }
                            {results.users.length > 0 && (
                                <CommandGroup heading={t("common:search.sections.users")}>
                                {results.users.map((u) => (
                                    <CommandItem key={`user-${u.id}`} asChild onSelect={() => setOpen(false)}>
                                    <Link href={`/users/${u.id}`} className="cursor-pointer">
                                        <Users className="mr-2 h-4 w-4" />
                                        {u.name} · {u.email}
                                    </Link>
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            )}

                        </CommandList>
                    </Command>
            </CommandDialog>
        </div>
    )
}