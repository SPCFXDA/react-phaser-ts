import Phaser from 'phaser';
import { Address } from 'viem';
import { Address as CoreAddress } from 'cive';

export abstract class BaseWalletManager extends Phaser.Plugins.BasePlugin {
    protected publicClient: any | null;
    protected walletClient: any | null;
    protected currentAccount: Address | CoreAddress | null;
    protected currentChainId: string | null;

    constructor(pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
        this.publicClient = null;
        this.walletClient = null;
        this.currentAccount = null;
        this.currentChainId = null;
    }

    abstract isWalletInstalled(): boolean;
    abstract connect(): Promise<Address | CoreAddress | undefined>;
    abstract disconnectWallet(): void;
    abstract getBalance(): Promise<string | null>;
    abstract sendTransaction(toAccount: CoreAddress | Address, amount: string): Promise<string | undefined>;
    abstract getBlockNumber(): Promise<number | undefined>;
    abstract setupListeners(): void;

    getAccount(): Address | CoreAddress | null {
        return this.currentAccount;
    }

    getChainId(): string | null {
        return this.currentChainId;
    }

    isConnected(): boolean {
        return this.currentAccount !== null;
    }
}
