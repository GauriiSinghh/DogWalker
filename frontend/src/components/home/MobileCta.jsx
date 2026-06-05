

function MobileCta({ onBook }) {
  return (
    <div className="mobile-cta">
      <div className="mobile-cta-inner">
        <button className="btn btn-whatsapp" onClick={onBook}>
          Book a Walk
        </button>
      </div>
    </div>
  );
}

export default MobileCta;