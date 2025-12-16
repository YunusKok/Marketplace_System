import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Calendar,
  User,
  Phone,
  MapPin,
  FileText
} from 'lucide-react'
import type { Cari, CariHareket } from '../types/types'

// Demo data - Görüntüdeki Cari Defteri formatına uygun
const demoCari: Cari = {
  id: '0392',
  kod: '0392',
  unvan: 'ALİ ALTIN-AKSU',
  yetkili: 'Ali Altın',
  telefon: '0532 123 4567',
  adres: 'Antalya Hali',
  vergiDairesi: 'Antalya',
  vergiNo: '1234567890',
  bakiye: 1170720,
  bakiyeTuru: 'A',
  olusturmaTarihi: '2024-01-15',
  guncellemeTarihi: '2025-12-03'
}

// Görüntüdeki verilere yakın demo hareketler
const demoHareketler: CariHareket[] = [
  { id: '1', cariId: '0392', tarih: '01.11.2025', aciklama: 'Devir', borc: 0, alacak: 50590, bakiye: 50590, bakiyeTuru: 'A', islemTipi: 'DIGER' },
  { id: '2', cariId: '0392', tarih: '01.11.2025', aciklama: 'S1-SER', borc: 0, alacak: 125675, bakiye: 176265, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '3', cariId: '0392', tarih: '01.11.2025', aciklama: 'S2-SER', borc: 0, alacak: 63795, bakiye: 240060, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '4', cariId: '0392', tarih: '01.11.2025', aciklama: 'S3-SER', borc: 0, alacak: 31245, bakiye: 271275, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '5', cariId: '0392', tarih: '01.11.2025', aciklama: 'S4-SER', borc: 0, alacak: 0, bakiye: 271275, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '6', cariId: '0392', tarih: '01.11.2025', aciklama: 'HAVALE', borc: 120000, alacak: 0, bakiye: 151275, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '7', cariId: '0392', tarih: '01.11.2025', aciklama: 'HAVALE', borc: 20000, alacak: 0, bakiye: 131275, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '8', cariId: '0392', tarih: '06.11.2025', aciklama: 'S5-SER', borc: 0, alacak: 148360, bakiye: 279635, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '9', cariId: '0392', tarih: '06.11.2025', aciklama: 'S5-SER', borc: 0, alacak: 164295, bakiye: 443930, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '10', cariId: '0392', tarih: '06.11.2025', aciklama: 'S6-SER', borc: 0, alacak: 90465, bakiye: 534395, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '11', cariId: '0392', tarih: '06.11.2025', aciklama: 'S7-SER', borc: 0, alacak: 78450, bakiye: 612845, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '12', cariId: '0392', tarih: '08.11.2025', aciklama: 'S8-SER', borc: 0, alacak: 0, bakiye: 612845, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '13', cariId: '0392', tarih: '08.11.2025', aciklama: 'HAVALE', borc: 250000, alacak: 0, bakiye: 362845, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '14', cariId: '0392', tarih: '08.11.2025', aciklama: 'ALİ ALTIN-ÖZGÜR KARATAŞ HAVALE', borc: 50000, alacak: 0, bakiye: 312845, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '15', cariId: '0392', tarih: '08.11.2025', aciklama: 'ALİ ALTIN-ÖZGÜR KARATAŞ HAVALE', borc: 250000, alacak: 0, bakiye: 62845, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '16', cariId: '0392', tarih: '15.11.2025', aciklama: '07/02/2026-0094880-KUVEYT ÇEK', borc: 63000, alacak: 0, bakiye: 155, bakiyeTuru: 'B', islemTipi: 'CEK' },
  { id: '17', cariId: '0392', tarih: '15.11.2025', aciklama: '16/02/2026-6953224-TEB ÇEK', borc: 150000, alacak: 0, bakiye: 150155, bakiyeTuru: 'B', islemTipi: 'CEK' },
  { id: '18', cariId: '0392', tarih: '15.11.2025', aciklama: '09/02/2026-21023508-AKBANK', borc: 100000, alacak: 0, bakiye: 250155, bakiyeTuru: 'B', islemTipi: 'CEK' },
  { id: '19', cariId: '0392', tarih: '15.11.2025', aciklama: '09/02/2026-0041111-GARANTİ ÇEK', borc: 120000, alacak: 0, bakiye: 370155, bakiyeTuru: 'B', islemTipi: 'CEK' },
  { id: '20', cariId: '0392', tarih: '15.11.2025', aciklama: '07/02/2026-H1-2772759-DENİZBANK ÇEK', borc: 200000, alacak: 0, bakiye: 570155, bakiyeTuru: 'B', islemTipi: 'CEK' },
  { id: '21', cariId: '0392', tarih: '15.11.2025', aciklama: 'S9-SER', borc: 0, alacak: 271550, bakiye: 298605, bakiyeTuru: 'B', islemTipi: 'FATURA' },
  { id: '22', cariId: '0392', tarih: '18.11.2025', aciklama: 'S10-SER', borc: 0, alacak: 105485, bakiye: 193120, bakiyeTuru: 'B', islemTipi: 'FATURA' },
  { id: '23', cariId: '0392', tarih: '18.11.2025', aciklama: 'S11-SER', borc: 0, alacak: 189295, bakiye: 3825, bakiyeTuru: 'B', islemTipi: 'FATURA' },
  { id: '24', cariId: '0392', tarih: '18.11.2025', aciklama: 'S12-SER', borc: 0, alacak: 152255, bakiye: 148430, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '25', cariId: '0392', tarih: '18.11.2025', aciklama: 'S13-SER', borc: 0, alacak: 116940, bakiye: 265370, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '26', cariId: '0392', tarih: '21.11.2025', aciklama: '05/02/2026-H4-2590652-DENİZBANK ÇEK', borc: 250000, alacak: 0, bakiye: 15370, bakiyeTuru: 'A', islemTipi: 'CEK' },
  { id: '27', cariId: '0392', tarih: '21.11.2025', aciklama: '07/02/2026-6953931-TEB ÇEK', borc: 230000, alacak: 0, bakiye: 93830, bakiyeTuru: 'B', islemTipi: 'CEK' },
  { id: '28', cariId: '0392', tarih: '21.11.2025', aciklama: 'HAVALE', borc: 0, alacak: 0, bakiye: 323630, bakiyeTuru: 'B', islemTipi: 'HAVALE' },
  { id: '29', cariId: '0392', tarih: '21.11.2025', aciklama: 'ALİ ALTIN HAVALE', borc: 50000, alacak: 0, bakiye: 373630, bakiyeTuru: 'B', islemTipi: 'HAVALE' },
  { id: '30', cariId: '0392', tarih: '21.11.2025', aciklama: 'S14-SER', borc: 0, alacak: 227985, bakiye: 145645, bakiyeTuru: 'B', islemTipi: 'FATURA' },
  { id: '31', cariId: '0392', tarih: '22.11.2025', aciklama: 'S14-SER', borc: 0, alacak: 26235, bakiye: 119410, bakiyeTuru: 'B', islemTipi: 'FATURA' },
  { id: '32', cariId: '0392', tarih: '22.11.2025', aciklama: 'S15-SER', borc: 0, alacak: 165375, bakiye: 45965, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '33', cariId: '0392', tarih: '22.11.2025', aciklama: 'S16-SER', borc: 0, alacak: 72305, bakiye: 118270, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '34', cariId: '0392', tarih: '22.11.2025', aciklama: 'S17-SER', borc: 0, alacak: 117115, bakiye: 235385, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '35', cariId: '0392', tarih: '22.11.2025', aciklama: 'S18-SER', borc: 0, alacak: 0, bakiye: 235385, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '36', cariId: '0392', tarih: '22.11.2025', aciklama: 'S19-SER', borc: 0, alacak: 155600, bakiye: 390985, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '37', cariId: '0392', tarih: '25.11.2025', aciklama: 'HAVALE-ÖZGÜR KARATAŞ', borc: 100000, alacak: 0, bakiye: 290985, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '38', cariId: '0392', tarih: '28.11.2025', aciklama: 'HAVALE-ÖZGÜR KARATAŞ', borc: 400000, alacak: 0, bakiye: 109015, bakiyeTuru: 'B', islemTipi: 'HAVALE' },
  { id: '39', cariId: '0392', tarih: '29.11.2025', aciklama: 'S20-SER', borc: 0, alacak: 252265, bakiye: 143250, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '40', cariId: '0392', tarih: '29.11.2025', aciklama: 'S21-SER', borc: 0, alacak: 316380, bakiye: 459630, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '41', cariId: '0392', tarih: '29.11.2025', aciklama: 'S21-SER', borc: 0, alacak: 268115, bakiye: 867745, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '42', cariId: '0392', tarih: '29.11.2025', aciklama: 'S22-SER', borc: 0, alacak: 268890, bakiye: 936435, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '43', cariId: '0392', tarih: '29.11.2025', aciklama: 'S23-SER', borc: 0, alacak: 231675, bakiye: 1168110, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '44', cariId: '0392', tarih: '29.11.2025', aciklama: 'S24-SER', borc: 0, alacak: 0, bakiye: 1168110, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '45', cariId: '0392', tarih: '29.11.2025', aciklama: 'HAVALE', borc: 200000, alacak: 0, bakiye: 968110, bakiyeTuru: 'A', islemTipi: 'HAVALE' },
  { id: '46', cariId: '0392', tarih: '03.12.2025', aciklama: 'S25-SER', borc: 0, alacak: 223735, bakiye: 1191845, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '47', cariId: '0392', tarih: '03.12.2025', aciklama: 'S26-SER', borc: 0, alacak: 78875, bakiye: 1270720, bakiyeTuru: 'A', islemTipi: 'FATURA' },
  { id: '48', cariId: '0392', tarih: '03.12.2025', aciklama: '17/03/2026-0036369-KUVEYT ÇEK', borc: 100000, alacak: 0, bakiye: 1170720, bakiyeTuru: 'A', islemTipi: 'CEK' },
]

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const CariEkstre: React.FC = () => {
  const { cariId } = useParams<{ cariId: string }>()
  const navigate = useNavigate()
  const [dateRange] = useState({ start: '01.11.2025', end: '03.12.2025' })

  // Gerçek uygulamada cariId'ye göre veri çekilecek
  // TODO: window.db.getCari(cariId) ve window.db.getHareketler(cariId) kullanılacak
  console.log('Loading ekstre for cari:', cariId)
  const cari = demoCari
  const hareketler = demoHareketler

  // Toplamları hesapla
  const toplamBorc = hareketler.reduce((sum, h) => sum + h.borc, 0)
  const toplamAlacak = hareketler.reduce((sum, h) => sum + h.alacak, 0)
  const sonBakiye = hareketler[hareketler.length - 1]

  return (
    <>
      <div className="page-header">
        <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Cari Ekstre</h1>
            <p>{cari.kod} - {cari.unvan}</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Calendar size={18} />
            Tarih Aralığı
          </button>
          <button className="btn btn-secondary">
            <Printer size={18} />
            Yazdır
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            Excel'e Aktar
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Cari Bilgi Kartı */}
        <div className="ekstre-header">
          <div className="ekstre-title">
            <h2>CARİ DEFTERİ</h2>
            <span>{dateRange.start} - {dateRange.end}</span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 24,
            padding: '20px 0',
            borderTop: '1px solid var(--border-color)',
            marginTop: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, height: 40, 
                background: 'rgba(99, 102, 241, 0.15)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cari Kodu</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{cari.kod}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, height: 40, 
                background: 'rgba(34, 197, 94, 0.15)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-success)'
              }}>
                <User size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ünvan</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{cari.unvan}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, height: 40, 
                background: 'rgba(245, 158, 11, 0.15)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-warning)'
              }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Telefon</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{cari.telefon}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, height: 40, 
                background: 'rgba(59, 130, 246, 0.15)', 
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-info)'
              }}>
                <MapPin size={20} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Adres</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{cari.adres}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ekstre Tablosu */}
        <div className="ekstre-table-wrapper">
          <table className="ekstre-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Tarih</th>
                <th>Açıklama</th>
                <th style={{ textAlign: 'right', width: 140 }}>Borç</th>
                <th style={{ textAlign: 'right', width: 140 }}>Alacak</th>
                <th style={{ textAlign: 'right', width: 160 }}>Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {hareketler.map((hareket) => (
                <tr key={hareket.id}>
                  <td style={{ fontWeight: 500 }}>{hareket.tarih}</td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      {hareket.islemTipi === 'CEK' && (
                        <span style={{
                          padding: '2px 6px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--accent-warning)',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600
                        }}>ÇEK</span>
                      )}
                      {hareket.islemTipi === 'HAVALE' && (
                        <span style={{
                          padding: '2px 6px',
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: 'var(--accent-success)',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600
                        }}>HAVALE</span>
                      )}
                      {hareket.aciklama}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {hareket.borc > 0 ? (
                      <span className="amount borc">{formatCurrency(hareket.borc)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {hareket.alacak > 0 ? (
                      <span className="amount alacak">{formatCurrency(hareket.alacak)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`bakiye-tag ${hareket.bakiyeTuru === 'A' ? 'alacak' : 'borc'}`}>
                      {formatCurrency(hareket.bakiye)} {hareket.bakiyeTuru}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ fontWeight: 700 }}>
                  Genel Toplam: {hareketler.length} işlem
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="amount borc" style={{ fontWeight: 700 }}>
                    {formatCurrency(toplamBorc)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="amount alacak" style={{ fontWeight: 700 }}>
                    {formatCurrency(toplamAlacak)}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className={`bakiye-tag ${sonBakiye?.bakiyeTuru === 'A' ? 'alacak' : 'borc'}`} style={{ fontSize: 14, padding: '6px 12px' }}>
                    {formatCurrency(sonBakiye?.bakiye || 0)} {sonBakiye?.bakiyeTuru}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer Note */}
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'var(--bg-card)', 
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: 'var(--text-secondary)'
        }}>
          <span>Sayfa 1/1</span>
          <span>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
    </>
  )
}

export default CariEkstre
