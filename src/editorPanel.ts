import * as vscode from 'vscode';
import { getWebviewContent, getNonce } from './gameContent';

export class FootballJugglePanel {
    public static readonly viewType = 'footballJuggle.editorPanel';
    private static _instance: FootballJugglePanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        panel: vscode.WebviewPanel,
        private readonly _context: vscode.ExtensionContext
    ) {
        this._panel = panel;
        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            msg => this._handleMessage(msg),
            null,
            this._disposables
        );
    }

    public static createOrShow(context: vscode.ExtensionContext): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (FootballJugglePanel._instance) {
            FootballJugglePanel._instance._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            FootballJugglePanel.viewType,
            'Juggle Master',
            column || vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [] }
        );

        FootballJugglePanel._instance = new FootballJugglePanel(panel, context);
    }

    private _update(): void {
        const bestStreak    = this._context.globalState.get<number>('footballJuggle.bestStreak', 0);
        const totalAttempts = this._context.globalState.get<number>('footballJuggle.totalAttempts', 0);

        this._panel.webview.html = getWebviewContent(
            this._panel.webview,
            getNonce(),
            bestStreak,
            totalAttempts,
            'editor'
        );
    }

    private _handleMessage(msg: { type: string; bestStreak?: number; totalAttempts?: number }): void {
        switch (msg.type) {
            case 'saveScore': {
                const best     = msg.bestStreak;
                const attempts = msg.totalAttempts;
                if (typeof best === 'number' && Number.isFinite(best) && best >= 0 && best <= 100000) {
                    this._context.globalState.update('footballJuggle.bestStreak', Math.floor(best));
                }
                if (typeof attempts === 'number' && Number.isFinite(attempts) && attempts >= 0 && attempts <= 1000000) {
                    this._context.globalState.update('footballJuggle.totalAttempts', Math.floor(attempts));
                }
                break;
            }
            case 'openInSidebar':
                vscode.commands.executeCommand('footballJuggle.gameView.focus');
                break;
        }
    }

    public dispose(): void {
        FootballJugglePanel._instance = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) d.dispose();
        }
    }
}
