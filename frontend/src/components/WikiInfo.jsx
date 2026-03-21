export default function WikiInfo({ data }) {
    if (!data || (!data.summary && !data.title)) return null;

    return (
        <div className="wiki-info card" id="wiki-info">
            <h2>📚 About this Location</h2>
            <div className="wiki-text">
                {data.title && <h3>{data.title}</h3>}
                <p>{data.summary}</p>
                {data.url && (
                    <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wiki-link"
                    >
                        Read more on Wikipedia →
                    </a>
                )}
            </div>
        </div>
    );
}
