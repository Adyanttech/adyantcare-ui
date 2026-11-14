import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import SlotPicker, { dayLabel, timeLabel } from '../SlotPicker';
import { Status, useAction, useLoad } from '../ui';
import type { BookingDoctor, BookingHospital, Slot } from '../types';

// Patient self-booking: hospital (where they are registered) -> doctor -> open time -> confirm.
export default function BookAppointment() {
  const act = useAction();
  const nav = useNavigate();

  const hospitals = useLoad<{ hospitals: BookingHospital[] }>(['bk-hospitals'], () => api.get('/me/booking/hospitals'));
  const [hospitalPick, setHospitalPick] = useState('');
  const hospitalId = hospitalPick || (hospitals.data?.hospitals.length === 1 ? hospitals.data.hospitals[0]!.id : '');

  const doctors = useLoad<{ doctors: BookingDoctor[] }>(['bk-doctors', hospitalId],
    () => api.get(`/me/booking/doctors?hospitalId=${hospitalId}`), !!hospitalId);
  const [doctorId, setDoctorId] = useState('');

  const slots = useLoad<{ slots: Slot[] }>(['bk-slots', hospitalId, doctorId],
    () => api.get(`/me/booking/slots?hospitalId=${hospitalId}&doctorId=${doctorId}`), !!hospitalId && !!doctorId);
  const [slotId, setSlotId] = useState('');
  const [reason, setReason] = useState('');
  const chosen = slots.data?.slots.find((s) => s.id === slotId);

  const book = async (e: FormEvent) => {
    e.preventDefault();
    if (!slotId) return;
    const ok = await act(() => api.post('/me/booking', { hospitalId, slotId, reason }), 'Appointment booked');
    if (ok) nav('/my');
    else { setSlotId(''); slots.reload(); doctors.reload(); }   // the slot may have just been taken
  };

  const hospital = hospitals.data?.hospitals.find((h) => h.id === hospitalId);

  return (
    <>
      <h1>Book an appointment</h1>
      <p className="sub">Choose a hospital, a doctor and a time that suits you. You can cancel online up to 2 hours before the visit.</p>

      <Status loading={hospitals.loading} error={hospitals.error} />
      {hospitals.data && hospitals.data.hospitals.length === 0 && (
        <div className="note">You are not registered at any hospital yet. Ask the hospital's front desk to register you.</div>
      )}

      {hospitals.data && hospitals.data.hospitals.length > 0 && (
        <>
          <div className="card mb">
            <h2><span className="stepno">1</span>Hospital</h2>
            <div className="picklist">
              {hospitals.data.hospitals.map((h) => (
                <button key={h.id} type="button" className={`pick ${hospitalId === h.id ? 'on' : ''}`}
                  onClick={() => { setHospitalPick(h.id); setDoctorId(''); setSlotId(''); }}>
                  <strong>{h.name}</strong>
                  <small>{h.city} · MRN {h.mrn}</small>
                </button>
              ))}
            </div>
          </div>

          {hospitalId && (
            <div className="card mb">
              <h2><span className="stepno">2</span>Doctor</h2>
              <Status loading={doctors.loading} error={doctors.error} />
              {doctors.data && doctors.data.doctors.length === 0 && <p className="muted">This hospital has no doctors listed yet.</p>}
              <div className="picklist">
                {doctors.data?.doctors.map((d) => (
                  <button key={d.id} type="button" disabled={d.openSlots === 0} className={`pick ${doctorId === d.id ? 'on' : ''}`}
                    onClick={() => { setDoctorId(d.id); setSlotId(''); }}>
                    <strong>{d.name}</strong>
                    <small>{d.specialty || 'General'} · {d.openSlots === 0 ? 'No open times' : `${d.openSlots} open time${d.openSlots === 1 ? '' : 's'}`}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hospitalId && doctorId && (
            <form className="card mb" onSubmit={book}>
              <h2><span className="stepno">3</span>Pick a time</h2>
              <Status loading={slots.loading} error={slots.error} />
              {slots.data && <SlotPicker slots={slots.data.slots} value={slotId} onChange={setSlotId} timeZone={hospital?.timeZone} empty="No open times in the next 30 days." />}

              {chosen && (
                <div style={{ marginTop: 18 }}>
                  <label style={{ maxWidth: 420 }}>
                    Reason for visit (optional)
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Fever, follow-up..." maxLength={300} />
                  </label>
                  <p style={{ margin: '14px 0' }}>
                    <strong>{chosen.doctorName}</strong> at {hospital?.name}, {dayLabel(chosen.startsAt, hospital?.timeZone)} at <strong>{timeLabel(chosen.startsAt, hospital?.timeZone)}</strong>
                  </p>
                  <button className="btn">Confirm booking</button>
                </div>
              )}
            </form>
          )}
        </>
      )}
      <p className="muted"><Link to="/my">Back to my health record</Link></p>
    </>
  );
}
