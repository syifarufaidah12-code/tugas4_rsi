import { useNavigate } from 'react-router-dom';
import { stallApi } from '../api/stallApi';
import { StallForm } from '../components/StallForm';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../utils/permissions';

export function StallCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="page page-narrow">
      <h1>Tambah Warung</h1>
      <p className="muted">
        Data dikirim ke <code>POST /stalls</code>. Pemilik warung otomatis diisi backend dari token
        login Anda ({user && ROLE_LABEL[user.role]}: {user?.name}).
      </p>
      <StallForm
        submitLabel="Simpan warung"
        onCancel={() => navigate(-1)}
        onSubmit={async (input) => {
          const created = await stallApi.create(input);
          // Arahkan ke detail -> data diambil ulang via GET /stalls/:id (bukti tersimpan di DB).
          navigate(`/stalls/${created.id}`, {
            replace: true,
            state: { flash: `Warung "${created.name}" berhasil ditambahkan (ID #${created.id}).` },
          });
        }}
      />
    </div>
  );
}
