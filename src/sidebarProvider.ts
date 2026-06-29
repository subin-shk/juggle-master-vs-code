import * as vscode from 'vscode';
import { getWebviewContent, getNonce } from './gameContent';
import { FootballJugglePanel } from './editorPanel';

export class FootballJuggleSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'footballJuggle.gameView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [],
        };

        const bestStreak    = this._context.globalState.get<number>('footballJuggle.bestStreak', 0);
        const totalAttempts = this._context.globalState.get<number>('footballJuggle.totalAttempts', 0);

        webviewView.webview.html = getWebviewContent(
            webviewView.webview,
            getNonce(),
            bestStreak,
            totalAttempts,
            'sidebar'
        );

        webviewView.webview.onDidReceiveMessage(
            msg => this._handleMessage(msg),
            undefined,
            this._context.subscriptions
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
            case 'openInEditor':
                FootballJugglePanel.createOrShow(this._context);
                break;
        }
    }

    public focus(): void {
        if (this._view) {
            this._view.show(true);
        }
    }
}
