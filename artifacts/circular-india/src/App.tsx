import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, Award, BadgeIndianRupee, Box, ChevronDown, CircleAlert,
  CircleCheck, Clock3, Coins, Compass, ExternalLink, Filter, HandHeart,
  Leaf, MapPin, Menu, PackageCheck, Recycle, Search, Sparkles, Star, Store,
  Wrench, X, Zap,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import {
  getGetDashboardQueryKey, getGetItemQueryKey, getListItemsQueryKey, useCreateItem, useGetDashboard, useGetItem, useListItems,
  useListPartners, useListRewards,
} from '@workspace/api-client-react';
import type { Dashboard, Item, Partner, Reward } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const categoryLabels: Record<string, string> = {
  electronics: 'Electronics', clothing: 'Clothing', books: 'Books', furniture: 'Furniture',
  appliances: 'Appliances', other: 'Other',
};
const conditionLabels: Record<string, string> = {
  like_new: 'Like new', good: 'Good condition', needs_repair: 'Needs repair', unusable: 'Unusable',
};
const recommendationMeta: Record<string, { label: string; note: string; icon: typeof Recycle; className: string }> = {
  reuse: { label: 'Reuse', note: 'Pass it forward', icon: HandHeart, className: 'bg-[#e0f0e7] text-[#28674f]' },
  refurbish: { label: 'Refurbish', note: 'Give it another chapter', icon: Wrench, className: 'bg-[#fbe6d9] text-[#9f4c2c]' },
  recycle: { label: 'Recycle', note: 'Return its materials', icon: Recycle, className: 'bg-[#e6ead6] text-[#65753e]' },
};
type SubmitForm = {
  name: string;
  category: 'electronics' | 'clothing' | 'books' | 'furniture' | 'appliances' | 'other';
  condition: 'like_new' | 'good' | 'needs_repair' | 'unusable';
  city: string;
  notes: string;
};

function formatDate(value?: string) {
  if (!value) return 'Recently';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { href: '/', label: 'Overview', icon: Compass },
    { href: '/submit', label: 'Submit an item', icon: PackageCheck },
    { href: '/items', label: 'My items', icon: Box },
    { href: '/partners', label: 'Find partners', icon: MapPin },
    { href: '/rewards', label: 'Rewards', icon: Award },
  ];
  return (
    <div className="grain min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[17.5rem] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-2">
          <span className="leaf-mark" aria-hidden="true" />
          <div>
            <div className="font-display text-xl font-bold leading-none">reloop</div>
            <div className="mt-1 font-mono-ui text-[9px] uppercase tracking-[.24em] text-sidebar-foreground/60">India / action center</div>
          </div>
          <button className="ml-auto rounded-lg p-2 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mt-12 px-2 font-mono-ui text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/45">Your circle</div>
        <nav className="mt-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.7} /><span>{label}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/70 p-4">
          <Leaf size={18} className="text-sidebar-primary" />
          <p className="mt-3 text-sm leading-5 text-sidebar-foreground/80">Small choices add up. Keep one item in the loop today.</p>
          <Link href="/submit" data-testid="link-sidebar-submit" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-sidebar-primary">Start a submission <ArrowRight size={13} /></Link>
        </div>
        <div className="mt-5 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">AM</div>
          <div><div className="text-xs font-semibold">Aarav Mehta</div><div className="font-mono-ui text-[9px] text-sidebar-foreground/50">CIRCLE MEMBER</div></div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-20 bg-[#19362f]/45 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" data-testid="button-overlay" />}
      <main className="min-h-[100dvh] md:pl-[17.5rem]">
        <header className="sticky top-0 z-10 flex h-[4.5rem] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button className="rounded-xl border border-border p-2.5 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={19} /></button>
          <div className="hidden font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground md:block">A more useful afterlife for things</div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/rewards" data-testid="link-header-rewards" className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-transform hover:-translate-y-0.5"><Coins size={15} className="text-accent" /> <span className="hidden sm:inline">Your points</span></Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">AM</div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function PageFrame({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return <div className="page-in mx-auto max-w-[76rem] px-5 py-8 md:px-10 md:py-12">
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div><p className="font-mono-ui text-[10px] uppercase tracking-[.22em] text-primary">{eyebrow}</p><h1 className="mt-2 font-display text-4xl font-bold tracking-[-.03em] text-foreground md:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
      {action}
    </div>
    {children}
  </div>;
}

function LoadingCards({ count = 3 }: { count?: number }) {
  return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: count }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div>;
}

function ErrorNotice({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-[#e7bcb0] bg-[#fff3ef] p-6 text-[#883f2f]"><div className="flex items-start gap-3"><CircleAlert size={19} /><div><p className="font-semibold">We could not load this view</p><p className="mt-1 text-sm opacity-80">Your circle is still here. Try again in a moment.</p>{onRetry && <button onClick={onRetry} data-testid="button-retry" className="mt-4 rounded-lg bg-[#883f2f] px-3 py-2 text-xs font-bold text-white">Try again</button>}</div></div></div>;
}

function ImpactStrip({ impact }: { impact?: Dashboard['impact'] }) {
  const values = [{ value: impact?.itemsDiverted ?? 0, label: 'items kept in use', icon: Recycle }, { value: `${impact?.co2Saved ?? 0} kg`, label: 'CO₂ kept from air', icon: Leaf }, { value: `${impact?.waterSaved ?? 0} L`, label: 'water saved', icon: Zap }];
  return <div className="grid grid-cols-3 divide-x divide-[#6e937f]/25 rounded-2xl bg-primary px-3 py-5 text-primary-foreground md:px-6">{values.map(({ value, label, icon: Icon }) => <div key={label} className="px-2 first:pl-1 md:px-5"><Icon size={16} className="mb-3 text-accent" /><div className="font-display text-xl font-bold md:text-2xl" data-testid={`text-impact-${label.replaceAll(' ', '-')}`}>{value}</div><div className="mt-1 text-[10px] leading-4 text-primary-foreground/65 md:text-xs">{label}</div></div>)}</div>;
}

function RecommendationPill({ recommendation }: { recommendation: string }) {
  const meta = recommendationMeta[recommendation] ?? recommendationMeta.recycle;
  const Icon = meta.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${meta.className}`}><Icon size={12} />{meta.label}</span>;
}

function ItemRow({ item, onOpen }: { item: Item; onOpen?: (id: number) => void }) {
  return <button onClick={() => onOpen?.(item.id)} data-testid={`card-item-${item.id}`} className="group flex w-full items-center gap-3 border-b border-border/70 py-4 text-left last:border-0 hover:bg-muted/40 md:px-2">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Box size={18} /></div>
    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.name}</div><div className="mt-1 flex gap-2 text-[11px] text-muted-foreground"><span>{categoryLabels[item.category] ?? item.category}</span><span>·</span><span>{formatDate(item.createdAt)}</span></div></div>
    <div className="hidden sm:block"><RecommendationPill recommendation={item.recommendation} /></div><ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" />
  </button>;
}

function Home() {
  const dashboard = useGetDashboard();
  const [location, setLocation] = useLocation();
  const data = dashboard.data;
  if (dashboard.isLoading) return <PageFrame eyebrow="Your circle" title="Loading your impact"><LoadingCards count={3} /></PageFrame>;
  if (dashboard.isError) return <PageFrame eyebrow="Your circle" title="Welcome back"><ErrorNotice onRetry={() => dashboard.refetch()} /></PageFrame>;
  return <PageFrame eyebrow="Monday, 14 October · Mumbai" title={`Good morning, ${data?.firstName ?? 'Aarav'}.`} description="One thoughtful next step is all it takes to keep more things in the loop." action={<Link href="/submit" data-testid="button-home-submit" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground shadow-sm transition-transform hover:-translate-y-0.5">Submit an item <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>}>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
      <section className="rise-in"><ImpactStrip impact={data?.impact} /></section>
      <section className="rise-in delay-1 flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Next best action</span><Sparkles size={17} className="text-accent" /></div>
        <div className="mt-6"><p className="font-display text-2xl font-bold leading-tight">{data?.nextAction ?? 'Give one more thing a useful next chapter.'}</p><Link href="/submit" data-testid="link-next-action" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Find its best path <ArrowRight size={14} /></Link></div>
      </section>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rise-in delay-2 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] md:p-6">
        <div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Recent submissions</p><h2 className="mt-1 font-display text-2xl font-bold">Your items in motion</h2></div><Link href="/items" data-testid="link-view-all-items" className="text-xs font-bold text-primary">View all</Link></div>
        <div className="mt-3">{data?.recentItems?.length ? data.recentItems.slice(0, 4).map(item => <ItemRow key={item.id} item={item} onOpen={id => setLocation(`/items/${id}`)} />) : <EmptyState icon={Box} title="Your circle starts here" body="Submit a used item and we will find its most useful next step." actionLabel="Submit your first item" href="/submit" />}</div>
      </section>
      <section className="rise-in delay-3 rounded-2xl bg-[#f6e6d6] p-5 md:p-6">
        <div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#9f4c2c]/70">Reward shelf</p><h2 className="mt-1 font-display text-2xl font-bold text-[#713a26]">Good choices, counted.</h2></div><BadgeIndianRupee size={21} className="text-[#9f4c2c]" /></div>
        <div className="mt-6 space-y-3">{data?.recentRewards?.length ? data.recentRewards.slice(0, 3).map(reward => <RewardRow key={reward.id} reward={reward} warm />) : <p className="py-6 text-sm text-[#713a26]/70">Your first points are waiting on the other side of a submission.</p>}</div>
        <Link href="/rewards" data-testid="link-view-rewards-home" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#9f4c2c]">See your rewards <ArrowRight size={14} /></Link>
      </section>
    </div>
    <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 md:flex-row md:items-center md:p-6"><div className="flex gap-3"><div className="mt-0.5 text-primary"><Store size={20} /></div><div><h3 className="font-semibold">Need a nearby hand?</h3><p className="mt-1 text-sm text-muted-foreground">Find trusted collection, repair, and recycling partners in your city.</p></div></div><Link href="/partners" data-testid="link-find-partners-home" className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-card px-3 py-2 text-xs font-bold text-primary">Explore partners <ArrowRight size={14} /></Link></div>
  </PageFrame>;
}

function EmptyState({ icon: Icon, title, body, actionLabel, href }: { icon: typeof Box; title: string; body: string; actionLabel?: string; href?: string }) {
  return <div className="flex flex-col items-center px-4 py-10 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon size={21} /></div><h3 className="mt-4 font-display text-xl font-bold">{title}</h3><p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">{body}</p>{actionLabel && href && <Link href={href} data-testid="link-empty-action" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">{actionLabel}<ArrowRight size={13} /></Link>}</div>;
}

function SubmitPage() {
  const createItem = useCreateItem();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<Item | null>(null);
  const [form, setForm] = useState<SubmitForm>({ name: '', category: 'electronics', condition: 'good', city: 'Mumbai', notes: '' });
  const update = (key: keyof SubmitForm, value: string) => setForm(prev => ({ ...prev, [key]: value } as SubmitForm));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    createItem.mutate({ data: { ...form, notes: form.notes || null } }, {
      onSuccess: item => { setSubmitted(item); queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); },
    });
  };
  if (submitted) {
    const meta = recommendationMeta[submitted.recommendation] ?? recommendationMeta.recycle;
    const Icon = meta.icon;
    return <PageFrame eyebrow="Submission received" title="A useful next chapter is ready." description="Here is the path our circular network recommends for your item."><div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-md)] md:p-10"><div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.className}`}><Icon size={27} /></div><p className="mt-8 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Smart recommendation</p><h2 className="mt-2 font-display text-4xl font-bold">{meta.label} this {submitted.name}</h2><p className="mt-4 text-base leading-7 text-muted-foreground">{submitted.recommendationReason}</p><div className="mt-6 rounded-xl bg-muted p-4 text-sm"><span className="font-semibold">You will earn {submitted.points} points</span><span className="mx-2 text-muted-foreground">·</span><span className="text-muted-foreground">We will help you find the right partner nearby.</span></div><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/items" data-testid="link-submission-items" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Track this item <ArrowRight size={16} /></Link><button onClick={() => { setSubmitted(null); setForm({ name: '', category: 'electronics', condition: 'good', city: 'Mumbai', notes: '' }); }} data-testid="button-submit-another" className="rounded-xl border border-border px-4 py-3 text-sm font-bold">Submit another item</button></div></div></PageFrame>;
  }
  return <PageFrame eyebrow="Keep it in the loop" title="What are you ready to pass on?" description="Tell us a little about your used product. We will make the responsible next step feel simple." action={<div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span> Tell us about it <ArrowRight size={14} /><span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[10px]">2</span> Get its path</div>}>
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_.55fr]">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] md:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold">What is it?</span><input required minLength={1} value={form.name} onChange={e => update('name', e.target.value)} placeholder="For example, Samsung Galaxy S20" data-testid="input-item-name" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <label><span className="mb-2 block text-sm font-semibold">Category</span><div className="relative"><select value={form.category} onChange={e => update('category', e.target.value)} data-testid="select-item-category" className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-4 top-4 text-muted-foreground" /></div></label>
          <label><span className="mb-2 block text-sm font-semibold">Condition</span><div className="relative"><select value={form.condition} onChange={e => update('condition', e.target.value)} data-testid="select-item-condition" className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary">{Object.entries(conditionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-4 top-4 text-muted-foreground" /></div></label>
          <label><span className="mb-2 block text-sm font-semibold">Your city</span><input required value={form.city} onChange={e => update('city', e.target.value)} placeholder="Mumbai" data-testid="input-item-city" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
          <label><span className="mb-2 block text-sm font-semibold">Anything else? <span className="font-normal text-muted-foreground">(optional)</span></span><textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="A detail that helps us recommend the right path" data-testid="textarea-item-notes" className="min-h-12 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>
        </div>
        {createItem.isError && <div className="mt-5 flex gap-2 rounded-xl bg-[#fff3ef] p-3 text-xs text-[#883f2f]"><CircleAlert size={15} className="shrink-0" /> We could not submit this item. Please check the details and try again.</div>}
        <button type="submit" disabled={createItem.isPending} data-testid="button-submit-item" className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">{createItem.isPending ? 'Finding its best path…' : 'Find its best path'} {!createItem.isPending && <ArrowRight size={16} />}</button>
      </div>
      <div className="soft-grid flex min-h-[17rem] flex-col justify-between rounded-2xl border border-border bg-[#ecf1e6] p-6"><div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Sparkles size={19} /></div><h2 className="mt-8 font-display text-3xl font-bold leading-tight text-[#2a4a3d]">Not everything needs a bin.</h2><p className="mt-3 text-sm leading-6 text-[#557063]">A phone can become a student’s first phone. A shirt can become a new favourite. We look for that story first.</p></div><div className="mt-8 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.15em] text-[#557063]"><CircleCheck size={15} /> Better paths, together</div></div>
    </form>
  </PageFrame>;
}

function ItemsPage() {
  const items = useListItems();
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');
  const shown = useMemo(() => (items.data ?? []).filter(item => filter === 'all' || item.recommendation === filter), [items.data, filter]);
  return <PageFrame eyebrow="Your circle" title="Items in motion" description="A clear view of every product you have helped keep useful." action={<Link href="/submit" data-testid="button-items-submit" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground"><PackageCheck size={16} /> Submit an item</Link>}>
    <div className="mb-5 flex flex-wrap items-center gap-2"><Filter size={15} className="mr-1 text-muted-foreground" />{['all', 'reuse', 'refurbish', 'recycle'].map(value => <button key={value} onClick={() => setFilter(value)} data-testid={`button-filter-${value}`} className={`rounded-full px-3 py-2 text-xs font-bold capitalize transition-colors ${filter === value ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{value === 'all' ? 'All items' : value}</button>)}</div>
    {items.isLoading ? <LoadingCards count={4} /> : items.isError ? <ErrorNotice onRetry={() => items.refetch()} /> : shown.length ? <div className="rounded-2xl border border-border bg-card px-4 shadow-[var(--shadow-sm)]">{shown.map(item => <ItemRow key={item.id} item={item} onOpen={setSelected} />)}</div> : <div className="rounded-2xl border border-border bg-card"><EmptyState icon={Box} title={filter === 'all' ? 'Nothing here yet' : `No ${filter} paths yet`} body="Your submitted items will appear here with their recommendation and progress." actionLabel="Submit an item" href="/submit" /></div>}
    {selected !== null && <ItemDetail id={selected} onClose={() => setSelected(null)} />}
  </PageFrame>;
}

function ItemDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const item = useGetItem(id, { query: { enabled: !!id, queryKey: getGetItemQueryKey(id) } });
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#19362f]/40 p-0 sm:items-center sm:p-5"><button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close item details" data-testid="button-close-detail" /><div className="page-in relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-[var(--shadow-md)] sm:rounded-3xl"><button onClick={onClose} data-testid="button-close-item-detail" className="absolute right-5 top-5 rounded-lg p-2 hover:bg-muted"><X size={17} /></button>{item.isLoading ? <div className="space-y-4"><div className="h-6 w-2/3 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded bg-muted" /></div> : item.data ? <><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><Box size={19} /></div><div><p className="font-display text-2xl font-bold">{item.data.name}</p><p className="text-xs text-muted-foreground">{categoryLabels[item.data.category]} · {formatDate(item.data.createdAt)}</p></div></div><div className="mt-7 rounded-2xl bg-muted p-5"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Recommended path</span><RecommendationPill recommendation={item.data.recommendation} /></div><p className="mt-4 text-sm leading-6">{item.data.recommendationReason}</p></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-border p-3"><span className="text-xs text-muted-foreground">Status</span><p className="mt-1 font-semibold capitalize">{item.data.status.replaceAll('_', ' ')}</p></div><div className="rounded-xl border border-border p-3"><span className="text-xs text-muted-foreground">Points</span><p className="mt-1 font-semibold">{item.data.points} points</p></div></div></> : <ErrorNotice />}</div></div>;
}

function PartnerCard({ partner }: { partner: Partner }) {
  const TypeIcon = partner.type.toLowerCase().includes('repair') || partner.type.toLowerCase().includes('refurb') ? Wrench : partner.type.toLowerCase().includes('reuse') ? HandHeart : Recycle;
  return <article className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-1"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary"><TypeIcon size={20} /></div><span className="flex items-center gap-1 text-xs font-bold"><Star size={13} className="fill-accent text-accent" />{partner.rating.toFixed(1)}</span></div><h3 className="mt-5 text-base font-bold">{partner.name}</h3><p className="mt-1 text-xs capitalize text-muted-foreground">{partner.type} · {partner.distance}</p><div className="mt-4 flex flex-wrap gap-1.5">{partner.accepts.slice(0, 3).map(accept => <span key={accept} className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">{categoryLabels[accept] ?? accept}</span>)}</div><button onClick={() => window.alert(`Contact details for ${partner.name} will be shared shortly.`)} data-testid={`button-contact-partner-${partner.id}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/25 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">View partner <ExternalLink size={13} /></button></article>;
}

function PartnersPage() {
  const [city, setCity] = useState('Mumbai');
  const partners = useListPartners({ city: city || undefined });
  return <PageFrame eyebrow="Keep it local" title="People who can help" description="Trusted circular partners near you, ready for a product with more life in it."><div className="mb-7 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"><div className="flex flex-1 items-center gap-3"><MapPin size={18} className="text-primary" /><input value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && partners.refetch()} data-testid="input-partner-city" className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Search by city" /><button onClick={() => partners.refetch()} data-testid="button-search-partners" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Search size={15} /></button></div><div className="text-xs text-muted-foreground">Showing options around <span className="font-semibold text-foreground">{city || 'your city'}</span></div></div>{partners.isLoading ? <LoadingCards count={3} /> : partners.isError ? <ErrorNotice onRetry={() => partners.refetch()} /> : partners.data?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{partners.data.map(partner => <PartnerCard key={partner.id} partner={partner} />)}</div> : <div className="rounded-2xl border border-border bg-card"><EmptyState icon={MapPin} title="We are growing the circle" body={`There are no listed partners in ${city} yet. Try another nearby city or check back soon.`} /></div>}</PageFrame>;
}

function RewardRow({ reward, warm = false }: { reward: Reward; warm?: boolean }) {
  return <div className={`flex items-center gap-3 rounded-xl p-3 ${warm ? 'bg-[#fff3e9]/60' : 'border border-border bg-card'}`}><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${warm ? 'bg-[#f4c5a5] text-[#713a26]' : 'bg-secondary text-primary'}`}><Coins size={16} /></div><div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold ${warm ? 'text-[#713a26]' : ''}`}>{reward.title}</p><p className={`mt-0.5 text-[10px] ${warm ? 'text-[#9f4c2c]/70' : 'text-muted-foreground'}`}>{reward.status === 'pending' ? 'Pending' : formatDate(reward.date)}</p></div><span className={`font-mono-ui text-xs font-bold ${warm ? 'text-[#9f4c2c]' : 'text-primary'}`}>+{reward.points}</span></div>;
}

function RewardsPage() {
  const rewards = useListRewards();
  const earned = rewards.data?.filter(reward => reward.status === 'earned') ?? [];
  const pending = rewards.data?.filter(reward => reward.status === 'pending') ?? [];
  const total = earned.reduce((sum, reward) => sum + reward.points, 0);
  return <PageFrame eyebrow="Your circle" title="Rewards that matter" description="Every item you keep useful adds up to something tangible."><div className="grid gap-5 md:grid-cols-[.8fr_1.2fr]"><div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground md:p-8"><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[22px] border-primary-foreground/10" /><div className="absolute -bottom-14 -right-6 h-36 w-36 rounded-full border-[16px] border-accent/40" /><Coins size={22} className="text-accent" /><p className="mt-10 font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary-foreground/60">Available points</p><div className="mt-2 font-display text-6xl font-bold">{total}</div><p className="mt-2 text-sm text-primary-foreground/65">Ready to turn into something good.</p><Link href="/submit" data-testid="link-rewards-submit" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-xs font-bold text-accent-foreground">Earn more points <ArrowRight size={14} /></Link></div><div className="rounded-3xl border border-border bg-card p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-muted-foreground">Progress marker</p><h2 className="mt-1 font-display text-2xl font-bold">Your circle is moving</h2></div><Award size={23} className="text-accent" /></div><div className="mt-8 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full w-[68%] rounded-full bg-accent" /></div><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>{total} points earned</span><span>500 next milestone</span></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl font-bold">{earned.length}</p><p className="mt-1 text-xs text-muted-foreground">earned rewards</p></div><div className="rounded-xl bg-muted p-3"><p className="font-display text-2xl font-bold">{pending.length}</p><p className="mt-1 text-xs text-muted-foreground">in the works</p></div></div></div></div>{rewards.isLoading ? <div className="mt-7"><LoadingCards count={2} /></div> : rewards.isError ? <div className="mt-7"><ErrorNotice onRetry={() => rewards.refetch()} /></div> : <div className="mt-8 grid gap-8 md:grid-cols-2"><section><div className="mb-3 flex items-center gap-2"><CircleCheck size={16} className="text-primary" /><h2 className="font-display text-xl font-bold">Earned</h2></div><div className="space-y-2">{earned.length ? earned.map(reward => <RewardRow key={reward.id} reward={reward} />) : <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Your first earned reward will land here.</div>}</div></section><section><div className="mb-3 flex items-center gap-2"><Clock3 size={16} className="text-accent" /><h2 className="font-display text-xl font-bold">In the works</h2></div><div className="space-y-2">{pending.length ? pending.map(reward => <RewardRow key={reward.id} reward={reward} />) : <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No pending rewards right now.</div>}</div></section></div>}</PageFrame>;
}

function Router() {
  return <Shell><ErrorBoundary resetKey={window.location.pathname}><Switch><Route path="/" component={Home} /><Route path="/submit" component={SubmitPage} /><Route path="/items" component={ItemsPage} /><Route path="/items/:id" component={ItemsPage} /><Route path="/partners" component={PartnersPage} /><Route path="/rewards" component={RewardsPage} /><Route component={NotFound} /></Switch></ErrorBoundary></Shell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;