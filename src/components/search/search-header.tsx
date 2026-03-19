type SearchHeaderProps = {
  query?: string;
  total: number;
};

export function SearchHeader({ query, total }: SearchHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">
        {query?.trim() ? `Resultados para "${query}"` : "Todos os produtos"}
      </h1>
      <p className="text-muted-foreground text-sm">
        {total} {total === 1 ? "produto encontrado" : "produtos encontrados"}
      </p>
    </div>
  );
}
