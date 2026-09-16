export default function Footer({
  t,
  isFarsi,
}) {
  return (
    <footer
      className="footer"
      id="footer"
    >
      <div className="footer-top">
        <div className="footer-brand">
          <a
            href="#new"
            className="footer-logo"
          >
            MOUHER
          </a>

          <p>
            {isFarsi
              ? "لباس معاصر برای زندگی روزمره."
              : "Lebas-e moaser baraye zendegi-e roozmarreh."}
          </p>
        </div>

        <div className="footer-column">
          <h4>{t.footer.shop}</h4>

          <a href="#new">
            {t.footer.newIn}
          </a>

          <a href="#categories">
            {t.footer.collections}
          </a>

          <a href="#products">
            {t.footer.allClothing}
          </a>
        </div>

        <div className="footer-column">
          <h4>
            {t.footer.information}
          </h4>

          <a href="#footer">
            {t.footer.shipping}
          </a>

          <a href="#footer">
            {t.footer.returns}
          </a>

          <a href="#footer">
            {t.footer.sizeGuide}
          </a>

          <a href="#footer">
            {t.footer.contact}
          </a>
        </div>

        <div className="footer-column">
          <h4>{t.footer.follow}</h4>

          <a href="#footer">
            {t.footer.instagram}
          </a>

          <a href="#footer">
            {t.footer.pinterest}
          </a>

          <a href="#footer">
            {t.footer.tiktok}
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          {t.footer.copyright}
        </span>

        <div>
          <a href="#footer">
            {t.footer.privacy}
          </a>

          <a href="#footer">
            {t.footer.terms}
          </a>
        </div>

        <span>MOUHER</span>
      </div>
    </footer>
  );
}