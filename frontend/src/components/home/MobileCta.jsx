

function MobileCta({ onBook }) {
  return (
    <div className="mobile-cta">
      <button className="btn btn-whatsapp" onClick={onBook}>
        Book a Walk
      </button>
    </div>
  );
}

export default MobileCta;