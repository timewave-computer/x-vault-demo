export function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <p className="text-sm text-gray-500">
            Powered by Valence{" "}
            <a
              href="http://docs.valence.zone/examples/crosschain_vaults.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover transition"
            >
              x—vaults
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
