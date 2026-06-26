import * as vscode from 'vscode';
import { FootballJuggleSidebarProvider } from './sidebarProvider';
import { FootballJugglePanel } from './editorPanel';

export function activate(context: vscode.ExtensionContext): void {
    // On first install the globalState key won't exist, so scores default to 0.
    // Wipe any stale data that may have been left over from development testing.
    if (!context.globalState.get('footballJuggle.version')) {
        context.globalState.update('footballJuggle.bestStreak', 0);
        context.globalState.update('footballJuggle.totalAttempts', 0);
        context.globalState.update('footballJuggle.version', '0.0.1');
    }

    const sidebarProvider = new FootballJuggleSidebarProvider(context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            FootballJuggleSidebarProvider.viewType,
            sidebarProvider,
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('footballJuggle.startGame', () => {
            const config = vscode.workspace.getConfiguration('footballJuggle');
            const mode   = config.get<string>('openMode', 'sidebar');

            if (mode === 'sidebar') {
                vscode.commands.executeCommand('footballJuggle.gameView.focus');
            } else {
                FootballJugglePanel.createOrShow(context);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('footballJuggle.switchMode', async () => {
            const config  = vscode.workspace.getConfiguration('footballJuggle');
            const current = config.get<string>('openMode', 'sidebar');
            const next    = current === 'sidebar' ? 'editor' : 'sidebar';

            await config.update('openMode', next, vscode.ConfigurationTarget.Global);

            const msg = `Football Juggle: switched to ${next === 'sidebar' ? 'Sidebar' : 'Editor Tab'} mode`;
            const pick = await vscode.window.showInformationMessage(msg, 'Open Now');
            if (pick === 'Open Now') {
                vscode.commands.executeCommand('footballJuggle.startGame');
            }
        })
    );
}

export function deactivate(): void {}
