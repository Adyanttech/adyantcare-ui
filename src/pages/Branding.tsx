import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { api } from '../api';
import { useBranding } from '../brand';
import { Icon } from '../icons';
import { HospitalMark } from '../Logo';
import { PageHeader, Status, useAction, useLoad } from '../ui';
import { useAuth } from '../auth';
import type { Branding as BrandingData } from '../types';

const DEFAULT_COLOR = '#0f8b9d';
const PRESETS = ['#0f8b9d', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669', '#b45309', '#0f172a'];

// Shrinks a picked image in the browser so it is small enough to store and fast to load.
async function prepareImage(file: File, mode: 'logo' | 'cover'): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Please choose a PNG, JPEG or WebP image.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('That image could not be read.')); img.src = url; });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser cannot process images.');

    if (mode === 'logo') {
      const scale = Math.min(1, 256 / img.width, 256 / img.height);
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    }

    // banner: crop to 4:1 and size to 1600x400, lowering quality until it is small enough
    canvas.width = 1600;
    canvas.height = 400;
    const scale = Math.max(1600 / img.width, 400 / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (1600 - w) / 2, (400 - h) / 2, w, h);
    for (const q of [0.82, 0.7, 0.58, 0.45]) {
      const out = canvas.toDataURL('image/jpeg', q);
      if (out.length < 850_000) return out;
    }
    throw new Error('That picture is too detailed. Try a smaller one.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function Branding() {
  const { user } = useAuth();
  const { refresh } = useBranding();
  const act = useAction();
  const { data, error, loading, reload } = useLoad<BrandingData>(['branding-edit'], () => api.get('/branding'));

  const [tagline, setTagline] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [logo, setLogo] = useState<string | null | undefined>(undefined);   // undefined = unchanged, null = removed
  const [cover, setCover] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setTagline(data.tagline ?? '');
    setColor(data.brandColor ?? DEFAULT_COLOR);
    setLogo(undefined);
    setCover(undefined);
  }, [data]);

  if (loading || error || !data) return <Status loading={loading} error={error} />;

  const shownLogo = logo === undefined ? data.logoData : logo;
  const shownCover = cover === undefined ? data.coverData : cover;
  const dirty = logo !== undefined || cover !== undefined || tagline !== (data.tagline ?? '') || color !== (data.brandColor ?? DEFAULT_COLOR);

  const pick = (mode: 'logo' | 'cover') => async (e: { target: HTMLInputElement }) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const out = await act(() => prepareImage(f, mode));
    if (out) (mode === 'logo' ? setLogo : setCover)(out);
  };

  const save = async () => {
    setBusy(true);
    const body: Record<string, string> = { tagline: tagline.trim(), brandColor: color === DEFAULT_COLOR && !data.brandColor ? '' : color };
    if (logo !== undefined) body.logoData = logo ?? '';
    if (cover !== undefined) body.coverData = cover ?? '';
    const ok = await act(() => api.put<BrandingData>('/branding', body), 'Branding saved. Your whole team now sees it.');
    setBusy(false);
    if (ok) { refresh(); reload(); }
  };

  const reset = () => {
    setTagline(data.tagline ?? '');
    setColor(data.brandColor ?? DEFAULT_COLOR);
    setLogo(undefined);
    setCover(undefined);
  };

  const previewStyle = { '--brand': color } as CSSProperties;
  const heroStyle: CSSProperties | undefined = shownCover
    ? { backgroundImage: `linear-gradient(105deg, rgba(4,16,30,.82) 8%, rgba(4,16,30,.35) 70%), url("${shownCover}")` }
    : undefined;

  return (
    <>
      <PageHeader title="Branding" sub="Make AdyantCare look like your hospital. Everyone who signs in to your hospital sees your logo, banner and colour." />

      <div className="grid cols-brand">
        <div className="card rise">
          <h2>Your identity</h2>

          <div className="field-label">Hospital logo</div>
          <div className="upload">
            <HospitalMark name={data.name} logo={shownLogo} size={64} />
            <div className="upload-actions">
              <button className="btn ghost sm" type="button" onClick={() => logoInput.current?.click()}><Icon name="upload" size={15} /> Upload logo</button>
              {shownLogo && <button className="btn danger sm" type="button" onClick={() => setLogo(null)}><Icon name="trash" size={15} /> Remove</button>}
              <small>Square works best. PNG, JPEG or WebP. It is resized for you.</small>
            </div>
            <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick('logo')} />
          </div>

          <div className="field-label">Banner picture</div>
          <div className="upload wide">
            <div className="cover-thumb" style={shownCover ? { backgroundImage: `url("${shownCover}")` } : undefined}>
              {!shownCover && <span><Icon name="image" size={22} /> No banner yet</span>}
            </div>
            <div className="upload-actions">
              <button className="btn ghost sm" type="button" onClick={() => coverInput.current?.click()}><Icon name="upload" size={15} /> Upload banner</button>
              {shownCover && <button className="btn danger sm" type="button" onClick={() => setCover(null)}><Icon name="trash" size={15} /> Remove</button>}
              <small>Wide photo of your building or team. Cropped to 4:1.</small>
            </div>
            <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick('cover')} />
          </div>

          <label>
            Tagline
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={120} placeholder="Care that rises with every day." />
          </label>

          <div className="field-label">Brand colour</div>
          <div className="swatches">
            {PRESETS.map((c) => (
              <button key={c} type="button" className={color.toLowerCase() === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Use ${c}`} />
            ))}
            <label className="swatch-custom" title="Pick any colour">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <span>Custom</span>
            </label>
          </div>

          <div className="row mt">
            <button className="btn" onClick={save} disabled={!dirty || busy}>{busy ? <span className="spinner" /> : <Icon name="check" size={16} />} Save branding</button>
            <button className="btn ghost" onClick={reset} disabled={!dirty || busy}>Undo changes</button>
          </div>
        </div>

        <div className="rise" style={{ animationDelay: '80ms' }}>
          <div className="field-label preview-label">Live preview</div>
          <div className="preview" style={previewStyle}>
            <aside className="preview-side">
              <div className="preview-brand">
                <HospitalMark name={data.name} logo={shownLogo} size={34} />
                <div><strong>{data.name}</strong><span>{data.city}</span></div>
              </div>
              <i className="on"><Icon name="home" size={14} /> Overview</i>
              <i><Icon name="calendar" size={14} /> Appointments</i>
              <i><Icon name="user" size={14} /> Patients</i>
              <i><Icon name="file" size={14} /> Reports</i>
            </aside>
            <div className="preview-main">
              <div className={`hero ${shownCover ? 'has-cover' : ''}`} style={heroStyle}>
                <div className="hero-body">
                  <span className="hero-date"><Icon name="calendar" size={12} /> Today</span>
                  <h1>Good morning, {(user?.name ?? 'Admin').split(' ')[0]}</h1>
                  <p>{data.name}{tagline ? <> · <em>{tagline}</em></> : null}</p>
                  <div className="hero-actions"><span className="btn light sm">View reports</span></div>
                </div>
              </div>
              <div className="preview-cards">
                <div className="card statcard tone-brand"><span className="statcard-icon"><Icon name="calendar" size={16} /></span><div className="statcard-n">42</div><div className="statcard-l">Appointments today</div></div>
                <div className="card statcard tone-brand"><span className="statcard-icon"><Icon name="heart" size={16} /></span><div className="statcard-n">1,284</div><div className="statcard-l">Patients</div></div>
              </div>
              <div className="preview-foot"><Icon name="sparkle" size={12} /> Powered by AdyantCare</div>
            </div>
          </div>
          <p className="muted preview-note">This is how your team sees the app after signing in.</p>
        </div>
      </div>
    </>
  );
}
