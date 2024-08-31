import { GameObjects, Scene } from 'phaser';
import WalletManager from '../plugins/WalletManager';
import { EventBus } from '../EventBus';
import { Address } from 'viem';

export class MainMenu extends Scene {
    private walletManager: WalletManager;
    private accountText: Phaser.GameObjects.Text;
    private balanceText: Phaser.GameObjects.Text;
    private connectText: Phaser.GameObjects.Text;
    private chainInfoText: Phaser.GameObjects.Text;  // New text object for chain information
    private submenu: Phaser.GameObjects.Container;
    
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super('MainMenu');
    }

    async create() {
        // Initialize WalletManager
        this.walletManager = this.plugins.get('WalletManager') as WalletManager;
        this.walletManager.init();

        // Set background image
        this.background = this.add.image(512, 384, 'background');

        // Create "Connect MetaMask" button
        this.connectText = this.add.text(100, 100, 'Connect MetaMask', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        // Placeholder for displaying the current account and balance
        this.accountText = this.add.text(100, 150, 'Account: Not connected', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        this.balanceText = this.add.text(100, 200, 'Balance: N/A', {
            fontSize: '20px',
            backgroundColor: '#333',
            color: '#000',
            padding: { x: 10, y: 5 }
        });

        // New text object for displaying chain info
        this.chainInfoText = this.add.text(100, 250, 'Chain: N/A', {
            fontSize: '18px',
            backgroundColor: '#444',
            color: '#fff',
            padding: { x: 10, y: 5 }
        });

        // Create submenu container, initially hidden
        this.submenu = this.add.container(100, 350);
        this.createSubmenu();
        this.submenu.setVisible(false); // Hide until connected

        // Connect button event listener
        this.connectText.on('pointerdown', async () => {
            if (this.walletManager.isMetaMaskInstalled()) {
                if (this.walletManager.getAccount()) {
                    // Disconnect wallet if already connected
                    this.walletManager.disconnectWallet();
                    this.updateAccountInfo(undefined);
                    this.updateBalance(null);
                    this.updateChainInfo(null);
                } else {
                    // Connect wallet
                    const account = await this.walletManager.connect();
                    this.updateAccountInfo(account);   
                    const balance = await this.walletManager.getBalance();
                    this.updateBalance(balance);
                    this.updateChainInfo(this.walletManager.targetChain);
                }
            } else {
                console.error("MetaMask is not installed");
            }
        });

        // Emit event when scene is ready
        EventBus.emit('current-scene-ready', this);
    }

    // Update the displayed account information
    updateAccountInfo(account: Address | undefined) {
        if (account) {
            this.accountText.setText(`Account: ${account}`);
            this.connectText.setText('Disconnect MetaMask');
            this.submenu.setVisible(true);  // Show submenu when connected
        } else {
            this.accountText.setText('Account: Not connected');
            this.connectText.setText('Connect MetaMask');
            this.submenu.setVisible(false); // Hide submenu when disconnected
        }
    }

    // Update the displayed balance
    updateBalance(balance: string | null) {
        if (balance) {
            this.balanceText.setText(`Balance: ${balance} CFX`);
        } else {
            this.balanceText.setText('Balance: N/A');
        }
    }

    // Update the displayed chain information
    updateChainInfo(chainInfo: any) {
        if (chainInfo) {
            const { name, nativeCurrency, rpcUrls, blockExplorers } = chainInfo;
            this.chainInfoText.setText(
                `Chain: ${name}\n` +
                `Native Currency: ${nativeCurrency.name} (${nativeCurrency.symbol})\n` +
                `RPC URL: ${rpcUrls.default.http[0]}\n` +
                `Block Explorer: ${blockExplorers.default.url}`
            );
        } else {
            this.chainInfoText.setText('Chain: N/A');
        }
    }

    // Create submenu with additional wallet options
// Create submenu with additional wallet options
createSubmenu() {
    const viewBalanceButton = this.add.text(0, 0, 'View Balance', {
        fontSize: '18px',
        backgroundColor: '#444',
        color: '#fff',
        padding: { x: 8, y: 5 }
    }).setInteractive();

    const sendTransactionButton = this.add.text(0, 40, 'Send Transaction', {
        fontSize: '18px',
        backgroundColor: '#444',
        color: '#fff',
        padding: { x: 8, y: 5 }
    }).setInteractive();

    const getBlockNumberButton = this.add.text(0, 80, 'Get Block Number', {
        fontSize: '18px',
        backgroundColor: '#444',
        color: '#fff',
        padding: { x: 8, y: 5 }
    }).setInteractive();

    const switchNetworkButton = this.add.text(0, 120, 'Switch Network', {
        fontSize: '18px',
        backgroundColor: '#444',
        color: '#fff',
        padding: { x: 8, y: 5 }
    }).setInteractive();

    // Add submenu items to container
    this.submenu.add([viewBalanceButton, sendTransactionButton, getBlockNumberButton, switchNetworkButton]);

    // Logic to display balance when "View Balance" is clicked
    viewBalanceButton.on('pointerdown', async () => {
        const originalText = viewBalanceButton.text;  // Save original button text
        viewBalanceButton.setText('Loading...');      // Set button to loading
        try {
            const balance = await this.walletManager.getBalance();
            this.updateBalance(balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
        } finally {
            viewBalanceButton.setText(originalText);  // Reset button text after interaction
        }
    });

    // Logic to send a transaction when "Send Transaction" is clicked
    sendTransactionButton.on('pointerdown', async () => {
        const originalText = sendTransactionButton.text;  // Save original button text
        sendTransactionButton.setText('Loading...');      // Set button to loading
        try {
            const toAccount = this.walletManager.getAccount();
            if (toAccount) {
                const txnHash = await this.walletManager.sendTransaction(toAccount, "1");
                console.log(`Transaction hash: ${txnHash}`);
            }
        } catch (error) {
            console.error('Error sending transaction:', error);
        } finally {
            sendTransactionButton.setText(originalText);  // Reset button text after interaction
        }
    });

    // Logic to get block number when "Get Block Number" is clicked
    getBlockNumberButton.on('pointerdown', async () => {
        const originalText = getBlockNumberButton.text;  // Save original button text
        getBlockNumberButton.setText('Loading...');      // Set button to loading
        try {
            const blockNumber = await this.walletManager.getBlockNumber();
            console.log(`Current block number: ${blockNumber}`);
        } catch (error) {
            console.error('Error fetching block number:', error);
        } finally {
            getBlockNumberButton.setText(originalText);  // Reset button text after interaction
        }
    });

    // Logic to switch network when "Switch Network" is clicked
    switchNetworkButton.on('pointerdown', async () => {
        const originalText = switchNetworkButton.text;  // Save original button text
        switchNetworkButton.setText('Loading...');      // Set button to loading
        try {
            await this.walletManager.switchNetwork(this.walletManager.targetChain.id);
            console.log(`Switched to network: ${this.walletManager.targetChain.name}`);
        } catch (error) {
            console.error('Error switching network:', error);
        } finally {
            switchNetworkButton.setText(originalText);  // Reset button text after interaction
        }
    });
}


    // Change scene logic (remains unchanged)
    changeScene() {
        if (this.logoTween) {
            this.logoTween.stop();
            this.logoTween = null;
        }
        this.scene.start('Game');
    }

    // Move logo logic (remains unchanged)
    moveLogo(vueCallback: ({ x, y }: { x: number, y: number }) => void) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) {
                this.logoTween.pause();
            } else {
                this.logoTween.play();
            }
        } else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback) {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
