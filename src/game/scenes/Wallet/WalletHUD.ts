import { Scene } from 'phaser';
import { WalletPlugin } from '../../plugins/WalletPlugin';
import { EventBus } from '../../EventBus';
import { SelectionModal } from './ui/SelectionModal'; // Import SelectionModal
import { ConnectWalletButton } from './ui/ConnectWalletButton';
import { WalletPanel } from './ui/WalletPanel';

export class WalletHUD {
    private scene: Scene;
    private walletPlugin: WalletPlugin;
    private connectButton: ConnectWalletButton;
    private walletPanel: WalletPanel;
    private selectionModal: SelectionModal; // Add modal instance

    constructor(scene: Scene, walletPlugin: WalletPlugin) {
        this.scene = scene;
        this.walletPlugin = walletPlugin;

        const centerX = this.scene.scale.width / 2;
        const centerY = this.scene.scale.height / 2;

        // Initialize the selection modal with the walletPlugin
        this.selectionModal = new SelectionModal(scene, centerX, centerY, walletPlugin, this.handleModalConfirm.bind(this), this.handleModalCancel.bind(this));
        this.connectButton = new ConnectWalletButton(scene, centerX, centerY, () => {
            this.connectButton.setVisible(false);
            this.selectionModal.setVisible(true);
        });

        this.setupEventListeners();

        this.walletPanel = new WalletPanel(scene, this.scene.scale.width - 235, 60, walletPlugin, this.updateUIWithWalletStatus.bind(this));
        this.walletPanel.setVisible(false);
    }

    private setupEventListeners() {
        EventBus.on('wallet-connection-changed', () => this.updateUIWithWalletStatus());
    }

    private handleModalCancel() {
        this.connectButton.setVisible(true);
    }

    private handleModalConfirm(space: string, managerName: string) {
        try {
            // Set the current space
            this.walletPlugin.setCurrentSpace(space as 'core' | 'espace');

            // Set the current manager based on the name
            if (managerName === 'MetaMask') {
                this.walletPlugin.setCurrentManager('MetaMask');
            } else if (managerName === 'Fluent') {
                this.walletPlugin.setCurrentManager('Fluent');
            } else {
                throw new Error(`Unknown manager type: ${managerName}`);
            }

            // Attempt to connect with the selected manager
            this.walletPlugin.connect().then(_account => {
                this.updateUIWithWalletStatus();
            }).catch(error => {
                console.error('Error connecting to wallet:', error);
                this.connectButton.setVisible(true); // Re-show the connect button on error
            });
        } catch (error) {
            console.error('Error setting space or manager:', error);
            this.connectButton.setVisible(true); // Re-show the connect button on error
        }
    }

    private async updateUIWithWalletStatus() {
        const account = this.walletPlugin.currentAccount;
        if (account) {
            this.connectButton.setVisible(false);
            this.walletPanel.setVisible(true);
            this.walletPanel.updateAccountInfo(account);
            const chain = this.walletPlugin.getChainInfo();
            this.walletPanel.updateChainInfo(chain?.name || '');
        } else {
            this.connectButton.setVisible(true);
            this.walletPanel.setVisible(false);
            this.walletPanel.updateAccountInfo('');
            this.walletPanel.updateChainInfo('');
        }
    }
}
