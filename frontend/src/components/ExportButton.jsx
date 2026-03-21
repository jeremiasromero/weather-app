export default function ExportButton({ onExportAll }) {
    return (
        <button className="btn-export" onClick={onExportAll} id="btn-export-all">
            📄 Export All as PDF
        </button>
    );
}
