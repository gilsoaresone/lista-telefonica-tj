import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly activePage = signal<'consulta' | 'apis'>('consulta');
  protected readonly baseUrl = 'https://www.tjsp.jus.br';
  protected readonly searchType = signal('1');
  protected readonly query = signal('');
  protected readonly selectedCode = signal('');
  protected readonly suggestions = signal<Array<{ Codigo: number; Descricao: string }>>([]);
  protected readonly resultHtml = signal('');
  protected readonly resultRows = signal<string[][]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly status = signal('Clique em consultar para carregar toda a planilha.');
  protected readonly exportName = signal('lista-telefonica-tjsp.xlsx');
  protected readonly completeListLoaded = signal(false);
  protected readonly apiRoutes = [
    {
      method: 'GET',
      route: '/lista-telefonica-tjsp.csv',
      purpose:
        'Carrega a lista consolidada com 7.641 registros para consulta completa e exportação.',
    },
    {
      method: 'POST',
      route: '/AutoComplete/ListarMunicipios',
      purpose: 'Endpoint legado para localizar municípios no portal TJSP.',
    },
    {
      method: 'POST',
      route: '/AutoComplete/ListarImoveis',
      purpose: 'Endpoint legado para localizar imóveis no portal TJSP.',
    },
    {
      method: 'POST',
      route: '/AutoComplete/ListarSetores',
      purpose: 'Endpoint legado para localizar setores no portal TJSP.',
    },
    {
      method: 'POST',
      route: '/ListaTelefonica/RetornarResultadoBusca',
      purpose: 'Retorna o resultado da consulta telefônica para exibição e exportação.',
    },
    {
      method: 'POST',
      route: '/ListaTelefonica/ObterImovel',
      purpose: 'Consulta os dados detalhados de um imóvel.',
    },
    {
      method: 'POST',
      route: '/ListaTelefonica/ObterSetoresPorImovel',
      purpose: 'Lista os setores vinculados a um imóvel.',
    },
    {
      method: 'GET',
      route: '/Solicitacao/ObterMunicipioComSuaRaj',
      purpose: 'Consulta a Região Administrativa Judiciária do município.',
    },
  ];

  constructor(private readonly http: HttpClient) {}

  protected onTypeChange(type: string): void {
    this.searchType.set(type);
    this.query.set('');
    this.selectedCode.set('');
    this.suggestions.set([]);
    this.clearResult();
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.selectedCode.set('');
    if (value.trim().length < 3) {
      this.suggestions.set([]);
      this.status.set('Digite pelo menos 3 caracteres para pesquisar.');
      return;
    }
    this.loading.set(true);
    const action =
      this.searchType() === '1'
        ? 'ListarMunicipios'
        : this.searchType() === '2'
          ? 'ListarImoveis'
          : 'ListarSetores';
    this.http
      .post<unknown>(`${this.baseUrl}/AutoComplete/${action}`, null, {
        params: { texto: value.trim() },
        responseType: 'json',
      })
      .subscribe({
        next: (response) => {
          this.suggestions.set(this.normalizeSuggestions(response));
          this.status.set(
            this.suggestions().length
              ? 'Selecione um resultado para consultar.'
              : 'Nenhum resultado encontrado.',
          );
          this.loading.set(false);
        },
        error: () =>
          this.handleError(
            'Não foi possível consultar o autocomplete. Verifique o acesso ao portal TJSP.',
          ),
      });
  }

  protected selectSuggestion(item: { Codigo: number; Descricao: string }): void {
    this.selectedCode.set(String(item.Codigo));
    this.query.set(item.Descricao);
    this.suggestions.set([]);
    this.search();
  }

  protected search(): void {
    if (!this.selectedCode()) {
      this.error.set('Selecione um item da lista de sugestões antes de consultar.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.http
      .post(`${this.baseUrl}/ListaTelefonica/RetornarResultadoBusca`, null, {
        params: { parmsEntrada: this.selectedCode(), codigoTipoBusca: this.searchType() },
        responseType: 'text',
      })
      .subscribe({
        next: (html) => {
          this.resultHtml.set(html);
          this.resultRows.set(this.extractRows(html));
          this.status.set('Consulta concluída.');
          this.loading.set(false);
        },
        error: () =>
          this.handleError(
            'A consulta falhou. O portal pode estar indisponível ou bloqueando acesso direto.',
          ),
      });
  }

  protected loadCompleteList(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get('/lista-telefonica-tjsp.csv', { responseType: 'text' }).subscribe({
      next: (csv) => {
        const rows = this.parseCsv(csv);
        this.resultRows.set(rows);
        this.resultHtml.set('local');
        this.completeListLoaded.set(true);
        this.status.set(`${rows.length - 1} registros carregados.`);
        this.loading.set(false);
      },
      error: () => this.handleError('Não foi possível carregar a lista completa.'),
    });
  }

  protected exportExcel(): void {
    const rows = this.resultRows();
    if (!rows.length) {
      this.error.set('Faça uma consulta antes de gerar o Excel.');
      return;
    }
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista Telefônica');
    XLSX.writeFile(workbook, this.exportName().trim() || 'lista-telefonica-tjsp.xlsx');
    this.status.set('Excel gerado com sucesso.');
  }

  protected clearResult(): void {
    this.resultHtml.set('');
    this.resultRows.set([]);
    this.error.set('');
  }
  protected selectAll(): void {
    this.searchType.set('1');
    this.query.set('');
    this.selectedCode.set('');
    this.suggestions.set([]);
    this.clearResult();
  }

  private normalizeSuggestions(response: unknown): Array<{ Codigo: number; Descricao: string }> {
    if (Array.isArray(response)) return response as Array<{ Codigo: number; Descricao: string }>;
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        return [];
      }
    }
    return [];
  }

  private extractRows(html: string): string[][] {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const table = document.querySelector('table');
    if (!table) return [['Resultado'], [document.body.textContent?.trim() || 'Consulta concluída']];
    return Array.from(table.querySelectorAll('tr')).map((row) =>
      Array.from(row.querySelectorAll('th,td')).map((cell) => cell.textContent?.trim() || ''),
    );
  }

  private parseCsv(csv: string): string[][] {
    return csv
      .replace(/^\uFEFF/, '')
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const cells: string[] = [];
        let cell = '';
        let quoted = false;
        for (let index = 0; index < line.length; index++) {
          const character = line[index];
          if (character === '"' && line[index + 1] === '"') {
            cell += '"';
            index++;
          } else if (character === '"') quoted = !quoted;
          else if (character === ';' && !quoted) {
            cells.push(cell.trim());
            cell = '';
          } else cell += character;
        }
        cells.push(cell.trim());
        return cells;
      });
  }

  private handleError(message: string): void {
    this.loading.set(false);
    this.error.set(message);
    this.status.set('Erro na consulta.');
  }
}
