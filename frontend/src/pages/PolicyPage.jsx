import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styles/policy.css";

function PolicyPage() {
  const { slug } = useParams();

  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const[loading, setLoading] = useState(true);

  useEffect(() => {
    
       async function loadPolicy() {
  try {
    setLoading(true);

    const pageRes = await fetch(`${API_BASE}/pages/${slug}`);
    const pageData = await pageRes.json();

    setTitle(pageData.title);

    const htmlRes = await fetch(
      `${API_BASE}${pageData.file_url}`
    );

    const htmlText = await htmlRes.text();

    setHtml(htmlText);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}

    loadPolicy();
  }, [slug]);


  if (loading) {
  return (
    <div className="policy-loading">
      Loading...
    </div>
  );
}
  return (
    <div className="policy-page">
      <div className="policy-container">
       

        <div
          className="policy-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

export default PolicyPage;