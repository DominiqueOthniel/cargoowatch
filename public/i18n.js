// Système de traduction multi-langues pour CargoWatch

const translations = {
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.trackShipment': 'Track Shipment',
        'nav.createShipment': 'Create Shipment',
        'nav.support': 'Support',
        'nav.login': 'Login',
        'nav.admin': 'Admin',
        'nav.logout': 'Logout',
        
        // Homepage
        'home.title': 'Your cargo.',
        'home.subtitle': 'Our watch.',
        'home.tagline': 'Every mile.',
        'home.description': 'Transform your logistics with real-time tracking, complete visibility, and enterprise-grade security. CargoWatch makes professional shipment monitoring accessible to businesses of all sizes.',
        'home.createShipment': 'Create Shipment',
        'home.trackPackage': 'Track Package',
        'home.activeShipments': 'Active Shipments',
        'home.deliveredToday': 'Delivered Today',
        'home.countriesServed': 'Countries Served',
        
        // Tracking
        'track.enterTrackingId': 'Enter tracking ID...',
        'track.enterTrackingIdExample': 'Enter tracking ID (e.g., CW20250101ABC123)',
        'track.trackShipment': 'Track Shipment',
        'track.trackYourShipment': 'Track Your Shipment',
        'track.search': 'Search',
        'track.track': 'Track',
        'track.recentShipments': 'Recent Shipments',
        'track.recentShipmentsLabel': 'Recent shipments:',
        'track.loading': 'Loading...',
        'track.noShipments': 'No shipments found',
        'track.noShipmentsFound': 'We couldn\'t find a shipment with that tracking ID. Please check the ID and try again, or contact support if you need assistance.',
        'track.tryAgain': 'Try Again',
        'track.contactSupport': 'Contact Support',
        'track.loadingRecentShipments': 'Loading recent shipments...',
        'track.noRecentShipments': 'No recent shipments available. Create your first shipment to get started!',
        'track.unableToLoad': 'Unable to load recent shipments.',
        'track.errorLoading': 'Error loading recent shipments.',
        'track.currentLocation': 'Current Location',
        'track.estimatedDelivery': 'Estimated Delivery',
        'track.expected': 'Expected:',
        'track.status': 'Status',
        'track.distanceRemaining': 'Distance Remaining',
        'track.getNotifications': 'Get Notifications',
        'track.share': 'Share',
        'track.shipmentTimeline': 'Shipment Timeline',
        'track.packagePickedUp': 'Package Picked Up',
        'track.departedOrigin': 'Departed Origin Facility',
        'track.inTransit': 'In Transit',
        'track.outForDelivery': 'Out for Delivery',
        'track.delivered': 'Delivered',
        'track.pickedUp': 'Picked Up',
        'track.nextStop': 'Next Stop:',
        'track.nextUpdate': 'Next Update:',
        'track.deliveryAddress': 'Delivery Address:',
        'track.enterTrackingDescription': 'Enter your tracking ID below to get real-time updates on your package location and delivery status.',
        'track.location': 'Location:',
        'track.packageDetails': 'Package Details',
        'track.senderInfo': 'Sender Information',
        'track.recipientInfo': 'Recipient Information',
        'track.deliveryMap': 'Delivery Map',
        
        // Shipment Creation
        'create.title': 'Create New Shipment',
        'create.sender': 'Sender Information',
        'create.recipient': 'Recipient Information',
        'create.package': 'Package Details',
        'create.service': 'Service Options',
        'create.cost': 'Cost Information',
        'create.next': 'Next',
        'create.previous': 'Previous',
        'create.submit': 'Submit Shipment',
        
        // Admin Dashboard
        'admin.welcome': 'Welcome back. Here\'s what\'s happening with your shipments today.',
        'admin.activeShipments': 'Active Shipments',
        'admin.inTransit': 'In Transit',
        'admin.deliveredToday': 'Delivered Today',
        'admin.clientMessages': 'Client Messages',
        'admin.createShipment': 'Create Shipment',
        'admin.exportReport': 'Export Report',
        'admin.downloadReceipts': 'Download Receipts',
        
        // Status
        'status.pending': 'Pending',
        'status.picked_up': 'Picked Up',
        'status.in_transit': 'In Transit',
        'status.out_for_delivery': 'Out for Delivery',
        'status.delivered': 'Delivered',
        'status.exception': 'Exception',
        
        // Common
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.clear': 'Clear',
        'common.actions': 'Actions',
        'common.download': 'Download',
        'common.generate': 'Generate',
        'common.close': 'Close',
    },
    
    fr: {
        // Navigation
        'nav.home': 'Accueil',
        'nav.trackShipment': 'Suivre Expédition',
        'nav.createShipment': 'Créer Expédition',
        'nav.support': 'Support',
        'nav.login': 'Connexion',
        'nav.admin': 'Admin',
        'nav.logout': 'Déconnexion',
        
        // Homepage
        'home.title': 'Votre cargaison.',
        'home.subtitle': 'Notre surveillance.',
        'home.tagline': 'Chaque kilomètre.',
        'home.description': 'Transformez votre logistique avec le suivi en temps réel, une visibilité complète et une sécurité de niveau entreprise. CargoWatch rend le suivi professionnel des expéditions accessible aux entreprises de toutes tailles.',
        'home.createShipment': 'Créer Expédition',
        'home.trackPackage': 'Suivre Colis',
        'home.activeShipments': 'Expéditions Actives',
        'home.deliveredToday': 'Livrées Aujourd\'hui',
        'home.countriesServed': 'Pays Desservis',
        
        // Tracking
        'track.enterTrackingId': 'Entrez le numéro de suivi...',
        'track.enterTrackingIdExample': 'Entrez le numéro de suivi (ex: CW20250101ABC123)',
        'track.trackShipment': 'Suivre Expédition',
        'track.trackYourShipment': 'Suivre Votre Expédition',
        'track.search': 'Rechercher',
        'track.track': 'Suivre',
        'track.recentShipments': 'Expéditions Récentes',
        'track.recentShipmentsLabel': 'Expéditions récentes :',
        'track.loading': 'Chargement...',
        'track.noShipments': 'Aucune expédition trouvée',
        'track.noShipmentsFound': 'Nous n\'avons pas pu trouver d\'expédition avec ce numéro de suivi. Veuillez vérifier le numéro et réessayer, ou contactez le support si vous avez besoin d\'aide.',
        'track.tryAgain': 'Réessayer',
        'track.contactSupport': 'Contacter le Support',
        'track.loadingRecentShipments': 'Chargement des expéditions récentes...',
        'track.noRecentShipments': 'Aucune expédition récente disponible. Créez votre première expédition pour commencer !',
        'track.unableToLoad': 'Impossible de charger les expéditions récentes.',
        'track.errorLoading': 'Erreur lors du chargement des expéditions récentes.',
        'track.currentLocation': 'Localisation Actuelle',
        'track.estimatedDelivery': 'Livraison Estimée',
        'track.expected': 'Attendu :',
        'track.status': 'Statut',
        'track.distanceRemaining': 'Distance Restante',
        'track.getNotifications': 'Recevoir des Notifications',
        'track.share': 'Partager',
        'track.shipmentTimeline': 'Chronologie de l\'Expédition',
        'track.packagePickedUp': 'Colis Récupéré',
        'track.departedOrigin': 'Départ de l\'Installation d\'Origine',
        'track.inTransit': 'En Transit',
        'track.outForDelivery': 'En Livraison',
        'track.delivered': 'Livré',
        'track.pickedUp': 'Récupéré',
        'track.nextStop': 'Prochain Arrêt :',
        'track.nextUpdate': 'Prochaine Mise à Jour :',
        'track.deliveryAddress': 'Adresse de Livraison :',
        'track.enterTrackingDescription': 'Entrez votre numéro de suivi ci-dessous pour obtenir des mises à jour en temps réel sur l\'emplacement de votre colis et l\'état de livraison.',
        'track.location': 'Localisation :',
        'track.packageDetails': 'Détails du Colis',
        'track.senderInfo': 'Informations Expéditeur',
        'track.recipientInfo': 'Informations Destinataire',
        'track.deliveryMap': 'Carte de Livraison',
        
        // Shipment Creation
        'create.title': 'Créer une Nouvelle Expédition',
        'create.sender': 'Informations Expéditeur',
        'create.recipient': 'Informations Destinataire',
        'create.package': 'Détails du Colis',
        'create.service': 'Options de Service',
        'create.cost': 'Informations Coût',
        'create.next': 'Suivant',
        'create.previous': 'Précédent',
        'create.submit': 'Soumettre l\'Expédition',
        
        // Admin Dashboard
        'admin.welcome': 'Bon retour. Voici ce qui se passe avec vos expéditions aujourd\'hui.',
        'admin.activeShipments': 'Expéditions Actives',
        'admin.inTransit': 'En Transit',
        'admin.deliveredToday': 'Livrées Aujourd\'hui',
        'admin.clientMessages': 'Messages Clients',
        'admin.createShipment': 'Créer Expédition',
        'admin.exportReport': 'Exporter Rapport',
        'admin.downloadReceipts': 'Télécharger Reçus',
        
        // Status
        'status.pending': 'En Attente',
        'status.picked_up': 'Récupéré',
        'status.in_transit': 'En Transit',
        'status.out_for_delivery': 'En Livraison',
        'status.delivered': 'Livré',
        'status.exception': 'Exception',
        
        // Common
        'common.loading': 'Chargement...',
        'common.save': 'Enregistrer',
        'common.cancel': 'Annuler',
        'common.delete': 'Supprimer',
        'common.edit': 'Modifier',
        'common.search': 'Rechercher',
        'common.filter': 'Filtrer',
        'common.clear': 'Effacer',
        'common.actions': 'Actions',
        'common.download': 'Télécharger',
        'common.generate': 'Générer',
        'common.close': 'Fermer',
    },
    
    es: {
        // Navigation
        'nav.home': 'Inicio',
        'nav.trackShipment': 'Rastrear Envío',
        'nav.createShipment': 'Crear Envío',
        'nav.support': 'Soporte',
        'nav.login': 'Iniciar Sesión',
        'nav.admin': 'Admin',
        'nav.logout': 'Cerrar Sesión',
        
        // Homepage
        'home.title': 'Su carga.',
        'home.subtitle': 'Nuestra vigilancia.',
        'home.tagline': 'Cada milla.',
        'home.description': 'Transforme su logística con seguimiento en tiempo real, visibilidad completa y seguridad de nivel empresarial. CargoWatch hace que el monitoreo profesional de envíos sea accesible para empresas de todos los tamaños.',
        'home.createShipment': 'Crear Envío',
        'home.trackPackage': 'Rastrear Paquete',
        'home.activeShipments': 'Envíos Activos',
        'home.deliveredToday': 'Entregados Hoy',
        'home.countriesServed': 'Países Atendidos',
        
        // Tracking
        'track.enterTrackingId': 'Ingrese el ID de seguimiento...',
        'track.trackShipment': 'Rastrear Envío',
        'track.search': 'Buscar',
        'track.recentShipments': 'Envíos Recientes',
        'track.noShipments': 'No se encontraron envíos',
        'track.currentLocation': 'Ubicación Actual',
        'track.estimatedDelivery': 'Entrega Estimada',
        'track.status': 'Estado',
        'track.distanceRemaining': 'Distancia Restante',
        
        // Shipment Creation
        'create.title': 'Crear Nuevo Envío',
        'create.sender': 'Información del Remitente',
        'create.recipient': 'Información del Destinatario',
        'create.package': 'Detalles del Paquete',
        'create.service': 'Opciones de Servicio',
        'create.cost': 'Información de Costo',
        'create.next': 'Siguiente',
        'create.previous': 'Anterior',
        'create.submit': 'Enviar Envío',
        
        // Admin Dashboard
        'admin.welcome': 'Bienvenido de nuevo. Esto es lo que está pasando con sus envíos hoy.',
        'admin.activeShipments': 'Envíos Activos',
        'admin.inTransit': 'En Tránsito',
        'admin.deliveredToday': 'Entregados Hoy',
        'admin.clientMessages': 'Mensajes de Clientes',
        'admin.createShipment': 'Crear Envío',
        'admin.exportReport': 'Exportar Informe',
        'admin.downloadReceipts': 'Descargar Recibos',
        
        // Status
        'status.pending': 'Pendiente',
        'status.picked_up': 'Recogido',
        'status.in_transit': 'En Tránsito',
        'status.out_for_delivery': 'En Entrega',
        'status.delivered': 'Entregado',
        'status.exception': 'Excepción',
        
        // Common
        'common.loading': 'Cargando...',
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Eliminar',
        'common.edit': 'Editar',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.clear': 'Limpiar',
        'common.actions': 'Acciones',
        'common.download': 'Descargar',
        'common.generate': 'Generar',
        'common.close': 'Cerrar',
    },
    
    de: {
        // Navigation
        'nav.home': 'Startseite',
        'nav.trackShipment': 'Sendung Verfolgen',
        'nav.createShipment': 'Sendung Erstellen',
        'nav.support': 'Support',
        'nav.login': 'Anmelden',
        'nav.admin': 'Admin',
        'nav.logout': 'Abmelden',
        
        // Homepage
        'home.title': 'Ihre Fracht.',
        'home.subtitle': 'Unsere Überwachung.',
        'home.tagline': 'Jede Meile.',
        'home.description': 'Transformieren Sie Ihre Logistik mit Echtzeit-Tracking, vollständiger Transparenz und Sicherheit auf Unternehmensebene. CargoWatch macht professionelles Versand-Monitoring für Unternehmen aller Größen zugänglich.',
        'home.createShipment': 'Sendung Erstellen',
        'home.trackPackage': 'Paket Verfolgen',
        'home.activeShipments': 'Aktive Sendungen',
        'home.deliveredToday': 'Heute Geliefert',
        'home.countriesServed': 'Bediente Länder',
        
        // Tracking
        'track.enterTrackingId': 'Sendungsnummer eingeben...',
        'track.trackShipment': 'Sendung Verfolgen',
        'track.search': 'Suchen',
        'track.recentShipments': 'Kürzliche Sendungen',
        'track.noShipments': 'Keine Sendungen gefunden',
        'track.currentLocation': 'Aktueller Standort',
        'track.estimatedDelivery': 'Geschätzte Lieferung',
        'track.status': 'Status',
        'track.distanceRemaining': 'Verbleibende Entfernung',
        
        // Shipment Creation
        'create.title': 'Neue Sendung Erstellen',
        'create.sender': 'Absenderinformationen',
        'create.recipient': 'Empfängerinformationen',
        'create.package': 'Paketdetails',
        'create.service': 'Serviceoptionen',
        'create.cost': 'Kostinformationen',
        'create.next': 'Weiter',
        'create.previous': 'Zurück',
        'create.submit': 'Sendung Einreichen',
        
        // Admin Dashboard
        'admin.welcome': 'Willkommen zurück. Hier ist, was heute mit Ihren Sendungen passiert.',
        'admin.activeShipments': 'Aktive Sendungen',
        'admin.inTransit': 'In Transit',
        'admin.deliveredToday': 'Heute Geliefert',
        'admin.clientMessages': 'Kunden-Nachrichten',
        'admin.createShipment': 'Sendung Erstellen',
        'admin.exportReport': 'Bericht Exportieren',
        'admin.downloadReceipts': 'Quittungen Herunterladen',
        
        // Status
        'status.pending': 'Ausstehend',
        'status.picked_up': 'Abgeholt',
        'status.in_transit': 'In Transit',
        'status.out_for_delivery': 'Zur Auslieferung',
        'status.delivered': 'Geliefert',
        'status.exception': 'Ausnahme',
        
        // Common
        'common.loading': 'Laden...',
        'common.save': 'Speichern',
        'common.cancel': 'Abbrechen',
        'common.delete': 'Löschen',
        'common.edit': 'Bearbeiten',
        'common.search': 'Suchen',
        'common.filter': 'Filtern',
        'common.clear': 'Löschen',
        'common.actions': 'Aktionen',
        'common.download': 'Herunterladen',
        'common.generate': 'Generieren',
        'common.close': 'Schließen',
    },
    
    pt: {
        // Navigation
        'nav.home': 'Início',
        'nav.trackShipment': 'Rastrear Envio',
        'nav.createShipment': 'Criar Envio',
        'nav.support': 'Suporte',
        'nav.login': 'Entrar',
        'nav.admin': 'Admin',
        'nav.logout': 'Sair',
        
        // Homepage
        'home.title': 'Sua carga.',
        'home.subtitle': 'Nossa vigilância.',
        'home.tagline': 'Cada milha.',
        'home.description': 'Transforme sua logística com rastreamento em tempo real, visibilidade completa e segurança de nível empresarial. CargoWatch torna o monitoramento profissional de envios acessível para empresas de todos os tamanhos.',
        'home.createShipment': 'Criar Envio',
        'home.trackPackage': 'Rastrear Pacote',
        'home.activeShipments': 'Envios Ativos',
        'home.deliveredToday': 'Entregues Hoje',
        'home.countriesServed': 'Países Atendidos',
        
        // Tracking
        'track.enterTrackingId': 'Digite o ID de rastreamento...',
        'track.trackShipment': 'Rastrear Envio',
        'track.search': 'Buscar',
        'track.recentShipments': 'Envios Recentes',
        'track.noShipments': 'Nenhum envio encontrado',
        'track.currentLocation': 'Localização Atual',
        'track.estimatedDelivery': 'Entrega Estimada',
        'track.status': 'Status',
        'track.distanceRemaining': 'Distância Restante',
        
        // Shipment Creation
        'create.title': 'Criar Novo Envio',
        'create.sender': 'Informações do Remetente',
        'create.recipient': 'Informações do Destinatário',
        'create.package': 'Detalhes do Pacote',
        'create.service': 'Opções de Serviço',
        'create.cost': 'Informações de Custo',
        'create.next': 'Próximo',
        'create.previous': 'Anterior',
        'create.submit': 'Enviar Envio',
        
        // Admin Dashboard
        'admin.welcome': 'Bem-vindo de volta. Aqui está o que está acontecendo com seus envios hoje.',
        'admin.activeShipments': 'Envios Ativos',
        'admin.inTransit': 'Em Trânsito',
        'admin.deliveredToday': 'Entregues Hoje',
        'admin.clientMessages': 'Mensagens de Clientes',
        'admin.createShipment': 'Criar Envio',
        'admin.exportReport': 'Exportar Relatório',
        'admin.downloadReceipts': 'Baixar Recibos',
        
        // Status
        'status.pending': 'Pendente',
        'status.picked_up': 'Coletado',
        'status.in_transit': 'Em Trânsito',
        'status.out_for_delivery': 'Saiu para Entrega',
        'status.delivered': 'Entregue',
        'status.exception': 'Exceção',
        
        // Common
        'common.loading': 'Carregando...',
        'common.save': 'Salvar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Excluir',
        'common.edit': 'Editar',
        'common.search': 'Buscar',
        'common.filter': 'Filtrar',
        'common.clear': 'Limpar',
        'common.actions': 'Ações',
        'common.download': 'Baixar',
        'common.generate': 'Gerar',
        'common.close': 'Fechar',
    },
    
    it: {
        // Navigation
        'nav.home': 'Home',
        'nav.trackShipment': 'Traccia Spedizione',
        'nav.createShipment': 'Crea Spedizione',
        'nav.support': 'Supporto',
        'nav.login': 'Accedi',
        'nav.admin': 'Admin',
        'nav.logout': 'Esci',
        
        // Homepage
        'home.title': 'Il tuo carico.',
        'home.subtitle': 'Il nostro monitoraggio.',
        'home.tagline': 'Ogni miglio.',
        'home.description': 'Trasforma la tua logistica con tracciamento in tempo reale, visibilità completa e sicurezza di livello aziendale. CargoWatch rende accessibile il monitoraggio professionale delle spedizioni alle aziende di tutte le dimensioni.',
        'home.createShipment': 'Crea Spedizione',
        'home.trackPackage': 'Traccia Pacco',
        'home.activeShipments': 'Spedizioni Attive',
        'home.deliveredToday': 'Consegnate Oggi',
        'home.countriesServed': 'Paesi Serviti',
        
        // Tracking
        'track.enterTrackingId': 'Inserisci ID di tracciamento...',
        'track.enterTrackingIdExample': 'Inserisci ID di tracciamento (es: CW20250101ABC123)',
        'track.trackShipment': 'Traccia Spedizione',
        'track.trackYourShipment': 'Traccia la Tua Spedizione',
        'track.search': 'Cerca',
        'track.track': 'Traccia',
        'track.recentShipments': 'Spedizioni Recenti',
        'track.recentShipmentsLabel': 'Spedizioni recenti:',
        'track.loading': 'Caricamento...',
        'track.noShipments': 'Nessuna spedizione trovata',
        'track.noShipmentsFound': 'Non siamo riusciti a trovare una spedizione con quell\'ID di tracciamento. Verifica l\'ID e riprova, o contatta il supporto se hai bisogno di assistenza.',
        'track.tryAgain': 'Riprova',
        'track.contactSupport': 'Contatta il Supporto',
        'track.loadingRecentShipments': 'Caricamento spedizioni recenti...',
        'track.noRecentShipments': 'Nessuna spedizione recente disponibile. Crea la tua prima spedizione per iniziare!',
        'track.unableToLoad': 'Impossibile caricare le spedizioni recenti.',
        'track.errorLoading': 'Errore nel caricamento delle spedizioni recenti.',
        'track.enterTrackingDescription': 'Inserisci il tuo ID di tracciamento qui sotto per ottenere aggiornamenti in tempo reale sulla posizione del tuo pacco e lo stato di consegna.',
        'track.currentLocation': 'Posizione Attuale',
        'track.estimatedDelivery': 'Consegna Stimata',
        'track.expected': 'Prevista:',
        'track.status': 'Stato',
        'track.distanceRemaining': 'Distanza Rimanente',
        'track.getNotifications': 'Ricevi Notifiche',
        'track.share': 'Condividi',
        'track.shipmentTimeline': 'Cronologia Spedizione',
        'track.packagePickedUp': 'Pacco Ritirato',
        'track.departedOrigin': 'Partenza dalla Struttura di Origine',
        'track.inTransit': 'In Transito',
        'track.outForDelivery': 'In Consegna',
        'track.delivered': 'Consegnato',
        'track.pickedUp': 'Ritirato',
        'track.nextStop': 'Prossima Fermata:',
        'track.nextUpdate': 'Prossimo Aggiornamento:',
        'track.deliveryAddress': 'Indirizzo di Consegna:',
        'track.location': 'Posizione:',
        'track.packageDetails': 'Dettagli Pacco',
        'track.senderInfo': 'Informazioni Mittente',
        'track.recipientInfo': 'Informazioni Destinatario',
        'track.deliveryMap': 'Mappa di Consegna',
        
        // Shipment Creation
        'create.title': 'Crea Nuova Spedizione',
        'create.sender': 'Informazioni Mittente',
        'create.recipient': 'Informazioni Destinatario',
        'create.package': 'Dettagli Pacco',
        'create.service': 'Opzioni Servizio',
        'create.cost': 'Informazioni Costo',
        'create.next': 'Successivo',
        'create.previous': 'Precedente',
        'create.submit': 'Invia Spedizione',
        
        // Admin Dashboard
        'admin.welcome': 'Bentornato. Ecco cosa sta succedendo con le tue spedizioni oggi.',
        'admin.activeShipments': 'Spedizioni Attive',
        'admin.inTransit': 'In Transito',
        'admin.deliveredToday': 'Consegnate Oggi',
        'admin.clientMessages': 'Messaggi Clienti',
        'admin.createShipment': 'Crea Spedizione',
        'admin.exportReport': 'Esporta Report',
        'admin.downloadReceipts': 'Scarica Ricevute',
        
        // Status
        'status.pending': 'In Attesa',
        'status.picked_up': 'Ritirato',
        'status.in_transit': 'In Transito',
        'status.out_for_delivery': 'In Consegna',
        'status.delivered': 'Consegnato',
        'status.exception': 'Eccezione',
        
        // Common
        'common.loading': 'Caricamento...',
        'common.save': 'Salva',
        'common.cancel': 'Annulla',
        'common.delete': 'Elimina',
        'common.edit': 'Modifica',
        'common.search': 'Cerca',
        'common.filter': 'Filtra',
        'common.clear': 'Cancella',
        'common.actions': 'Azioni',
        'common.download': 'Scarica',
        'common.generate': 'Genera',
        'common.close': 'Chiudi',
    },
    
    zh: {
        // Navigation
        'nav.home': '首页',
        'nav.trackShipment': '跟踪货物',
        'nav.createShipment': '创建货物',
        'nav.support': '支持',
        'nav.login': '登录',
        'nav.admin': '管理',
        'nav.logout': '登出',
        
        // Homepage
        'home.title': '您的货物。',
        'home.subtitle': '我们的监控。',
        'home.tagline': '每一英里。',
        'home.description': '通过实时跟踪、完整可见性和企业级安全性转变您的物流。CargoWatch使专业的货物监控可供各种规模的企业使用。',
        'home.createShipment': '创建货物',
        'home.trackPackage': '跟踪包裹',
        'home.activeShipments': '活跃货物',
        'home.deliveredToday': '今日送达',
        'home.countriesServed': '服务国家',
        
        // Tracking
        'track.enterTrackingId': '输入跟踪ID...',
        'track.trackShipment': '跟踪货物',
        'track.search': '搜索',
        'track.recentShipments': '最近货物',
        'track.noShipments': '未找到货物',
        'track.currentLocation': '当前位置',
        'track.estimatedDelivery': '预计送达',
        'track.status': '状态',
        'track.distanceRemaining': '剩余距离',
        
        // Shipment Creation
        'create.title': '创建新货物',
        'create.sender': '发件人信息',
        'create.recipient': '收件人信息',
        'create.package': '包裹详情',
        'create.service': '服务选项',
        'create.cost': '费用信息',
        'create.next': '下一步',
        'create.previous': '上一步',
        'create.submit': '提交货物',
        
        // Admin Dashboard
        'admin.welcome': '欢迎回来。以下是今天您货物的情况。',
        'admin.activeShipments': '活跃货物',
        'admin.inTransit': '运输中',
        'admin.deliveredToday': '今日送达',
        'admin.clientMessages': '客户消息',
        'admin.createShipment': '创建货物',
        'admin.exportReport': '导出报告',
        'admin.downloadReceipts': '下载收据',
        
        // Status
        'status.pending': '待处理',
        'status.picked_up': '已取件',
        'status.in_transit': '运输中',
        'status.out_for_delivery': '派送中',
        'status.delivered': '已送达',
        'status.exception': '异常',
        
        // Common
        'common.loading': '加载中...',
        'common.save': '保存',
        'common.cancel': '取消',
        'common.delete': '删除',
        'common.edit': '编辑',
        'common.search': '搜索',
        'common.filter': '筛选',
        'common.clear': '清除',
        'common.actions': '操作',
        'common.download': '下载',
        'common.generate': '生成',
        'common.close': '关闭',
    },
    
    ja: {
        // Navigation
        'nav.home': 'ホーム',
        'nav.trackShipment': '配送追跡',
        'nav.createShipment': '配送作成',
        'nav.support': 'サポート',
        'nav.login': 'ログイン',
        'nav.admin': '管理者',
        'nav.logout': 'ログアウト',
        
        // Homepage
        'home.title': 'あなたの貨物。',
        'home.subtitle': '私たちの監視。',
        'home.tagline': 'すべてのマイル。',
        'home.description': 'リアルタイム追跡、完全な可視性、企業レベルのセキュリティで物流を変革します。CargoWatchは、あらゆる規模の企業にプロフェッショナルな配送監視を提供します。',
        'home.createShipment': '配送作成',
        'home.trackPackage': '荷物追跡',
        'home.activeShipments': 'アクティブな配送',
        'home.deliveredToday': '本日配達',
        'home.countriesServed': 'サービス提供国',
        
        // Tracking
        'track.enterTrackingId': '追跡IDを入力...',
        'track.trackShipment': '配送追跡',
        'track.search': '検索',
        'track.recentShipments': '最近の配送',
        'track.noShipments': '配送が見つかりません',
        'track.currentLocation': '現在地',
        'track.estimatedDelivery': '推定配達',
        'track.status': 'ステータス',
        'track.distanceRemaining': '残り距離',
        
        // Shipment Creation
        'create.title': '新しい配送を作成',
        'create.sender': '送信者情報',
        'create.recipient': '受信者情報',
        'create.package': '荷物詳細',
        'create.service': 'サービスオプション',
        'create.cost': '費用情報',
        'create.next': '次へ',
        'create.previous': '前へ',
        'create.submit': '配送を送信',
        
        // Admin Dashboard
        'admin.welcome': 'おかえりなさい。今日の配送の状況です。',
        'admin.activeShipments': 'アクティブな配送',
        'admin.inTransit': '輸送中',
        'admin.deliveredToday': '本日配達',
        'admin.clientMessages': 'クライアントメッセージ',
        'admin.createShipment': '配送作成',
        'admin.exportReport': 'レポートエクスポート',
        'admin.downloadReceipts': '領収書ダウンロード',
        
        // Status
        'status.pending': '保留中',
        'status.picked_up': '引き取り済み',
        'status.in_transit': '輸送中',
        'status.out_for_delivery': '配達中',
        'status.delivered': '配達済み',
        'status.exception': '例外',
        
        // Common
        'common.loading': '読み込み中...',
        'common.save': '保存',
        'common.cancel': 'キャンセル',
        'common.delete': '削除',
        'common.edit': '編集',
        'common.search': '検索',
        'common.filter': 'フィルター',
        'common.clear': 'クリア',
        'common.actions': 'アクション',
        'common.download': 'ダウンロード',
        'common.generate': '生成',
        'common.close': '閉じる',
    },
    
    ru: {
        // Navigation
        'nav.home': 'Главная',
        'nav.trackShipment': 'Отследить Отправление',
        'nav.createShipment': 'Создать Отправление',
        'nav.support': 'Поддержка',
        'nav.login': 'Войти',
        'nav.admin': 'Админ',
        'nav.logout': 'Выйти',
        
        // Homepage
        'home.title': 'Ваш груз.',
        'home.subtitle': 'Наш контроль.',
        'home.tagline': 'Каждая миля.',
        'home.description': 'Преобразуйте свою логистику с отслеживанием в реальном времени, полной видимостью и безопасностью корпоративного уровня. CargoWatch делает профессиональный мониторинг отправлений доступным для предприятий любого размера.',
        'home.createShipment': 'Создать Отправление',
        'home.trackPackage': 'Отследить Посылку',
        'home.activeShipments': 'Активные Отправления',
        'home.deliveredToday': 'Доставлено Сегодня',
        'home.countriesServed': 'Обслуживаемые Страны',
        
        // Tracking
        'track.enterTrackingId': 'Введите ID отслеживания...',
        'track.trackShipment': 'Отследить Отправление',
        'track.search': 'Поиск',
        'track.recentShipments': 'Недавние Отправления',
        'track.noShipments': 'Отправления не найдены',
        'track.currentLocation': 'Текущее Местоположение',
        'track.estimatedDelivery': 'Предполагаемая Доставка',
        'track.status': 'Статус',
        'track.distanceRemaining': 'Оставшееся Расстояние',
        
        // Shipment Creation
        'create.title': 'Создать Новое Отправление',
        'create.sender': 'Информация Отправителя',
        'create.recipient': 'Информация Получателя',
        'create.package': 'Детали Посылки',
        'create.service': 'Варианты Услуги',
        'create.cost': 'Информация о Стоимости',
        'create.next': 'Далее',
        'create.previous': 'Назад',
        'create.submit': 'Отправить Отправление',
        
        // Admin Dashboard
        'admin.welcome': 'Добро пожаловать обратно. Вот что происходит с вашими отправлениями сегодня.',
        'admin.activeShipments': 'Активные Отправления',
        'admin.inTransit': 'В Транзите',
        'admin.deliveredToday': 'Доставлено Сегодня',
        'admin.clientMessages': 'Сообщения Клиентов',
        'admin.createShipment': 'Создать Отправление',
        'admin.exportReport': 'Экспортировать Отчет',
        'admin.downloadReceipts': 'Скачать Квитанции',
        
        // Status
        'status.pending': 'В Ожидании',
        'status.picked_up': 'Забрано',
        'status.in_transit': 'В Транзите',
        'status.out_for_delivery': 'На Доставке',
        'status.delivered': 'Доставлено',
        'status.exception': 'Исключение',
        
        // Common
        'common.loading': 'Загрузка...',
        'common.save': 'Сохранить',
        'common.cancel': 'Отмена',
        'common.delete': 'Удалить',
        'common.edit': 'Редактировать',
        'common.search': 'Поиск',
        'common.filter': 'Фильтр',
        'common.clear': 'Очистить',
        'common.actions': 'Действия',
        'common.download': 'Скачать',
        'common.generate': 'Создать',
        'common.close': 'Закрыть',
    },
    
    ar: {
        // Navigation
        'nav.home': 'الرئيسية',
        'nav.trackShipment': 'تتبع الشحنة',
        'nav.createShipment': 'إنشاء شحنة',
        'nav.support': 'الدعم',
        'nav.login': 'تسجيل الدخول',
        'nav.admin': 'المسؤول',
        'nav.logout': 'تسجيل الخروج',
        
        // Homepage
        'home.title': 'شحنتك.',
        'home.subtitle': 'مراقبتنا.',
        'home.tagline': 'كل ميل.',
        'home.description': 'حول لوجستيكك مع التتبع في الوقت الفعلي والشفافية الكاملة والأمان على مستوى المؤسسات. يجعل CargoWatch مراقبة الشحنات الاحترافية في متناول الشركات من جميع الأحجام.',
        'home.createShipment': 'إنشاء شحنة',
        'home.trackPackage': 'تتبع الطرد',
        'home.activeShipments': 'الشحنات النشطة',
        'home.deliveredToday': 'تم التسليم اليوم',
        'home.countriesServed': 'الدول المخدومة',
        
        // Tracking
        'track.enterTrackingId': 'أدخل معرف التتبع...',
        'track.trackShipment': 'تتبع الشحنة',
        'track.search': 'بحث',
        'track.recentShipments': 'الشحنات الأخيرة',
        'track.noShipments': 'لم يتم العثور على شحنات',
        'track.currentLocation': 'الموقع الحالي',
        'track.estimatedDelivery': 'التسليم المقدر',
        'track.status': 'الحالة',
        'track.distanceRemaining': 'المسافة المتبقية',
        
        // Shipment Creation
        'create.title': 'إنشاء شحنة جديدة',
        'create.sender': 'معلومات المرسل',
        'create.recipient': 'معلومات المستلم',
        'create.package': 'تفاصيل الطرد',
        'create.service': 'خيارات الخدمة',
        'create.cost': 'معلومات التكلفة',
        'create.next': 'التالي',
        'create.previous': 'السابق',
        'create.submit': 'إرسال الشحنة',
        
        // Admin Dashboard
        'admin.welcome': 'مرحباً بعودتك. إليك ما يحدث مع شحناتك اليوم.',
        'admin.activeShipments': 'الشحنات النشطة',
        'admin.inTransit': 'قيد العبور',
        'admin.deliveredToday': 'تم التسليم اليوم',
        'admin.clientMessages': 'رسائل العملاء',
        'admin.createShipment': 'إنشاء شحنة',
        'admin.exportReport': 'تصدير التقرير',
        'admin.downloadReceipts': 'تنزيل الإيصالات',
        
        // Status
        'status.pending': 'قيد الانتظار',
        'status.picked_up': 'تم الاستلام',
        'status.in_transit': 'قيد العبور',
        'status.out_for_delivery': 'جاهز للتسليم',
        'status.delivered': 'تم التسليم',
        'status.exception': 'استثناء',
        
        // Common
        'common.loading': 'جارٍ التحميل...',
        'common.save': 'حفظ',
        'common.cancel': 'إلغاء',
        'common.delete': 'حذف',
        'common.edit': 'تعديل',
        'common.search': 'بحث',
        'common.filter': 'تصفية',
        'common.clear': 'مسح',
        'common.actions': 'الإجراءات',
        'common.download': 'تنزيل',
        'common.generate': 'إنشاء',
        'common.close': 'إغلاق',
    }
};

// Gestionnaire de langues
class I18n {
    constructor() {
        // Langue par défaut : anglais (sauf si une préférence est sauvegardée)
        const savedLang = localStorage.getItem('cargowatch_lang');
        this.currentLanguage = savedLang || 'en';
        this.direction = this.getDirection(this.currentLanguage);
    }
    
    detectBrowserLanguage() {
        // Obtenir la langue du navigateur
        const browserLang = navigator.language || navigator.userLanguage || 'en';
        
        // Extraire le code de langue (ex: 'fr-FR' -> 'fr', 'en-US' -> 'en')
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // Mapper les langues supportées
        const supportedLanguages = ['en', 'fr', 'es', 'de', 'pt', 'it', 'zh', 'ja', 'ru', 'ar'];
        
        // Vérifier si la langue est supportée
        if (supportedLanguages.includes(langCode)) {
            return langCode;
        }
        
        // Si la langue complète est supportée (ex: 'zh-CN' pour chinois)
        if (supportedLanguages.includes(browserLang.toLowerCase())) {
            return browserLang.toLowerCase();
        }
        
        // Essayer avec navigator.languages (liste des langues préférées)
        if (navigator.languages && navigator.languages.length > 0) {
            for (const lang of navigator.languages) {
                const code = lang.split('-')[0].toLowerCase();
                if (supportedLanguages.includes(code)) {
                    return code;
                }
            }
        }
        
        // Par défaut: anglais
        return 'en';
    }
    
    getDirection(lang) {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
    }
    
    t(key, params = {}) {
        // Essayer d'abord la langue actuelle
        let translation = translations[this.currentLanguage]?.[key];
        
        // Si pas trouvé, essayer l'anglais
        if (!translation) {
            translation = translations.en[key];
        }
        
        // Si toujours pas trouvé, retourner la clé
        if (!translation) {
            console.warn(`Translation missing for key: ${key} in language: ${this.currentLanguage}`);
            return key;
        }
        
        // Remplacement de paramètres si nécessaire
        if (Object.keys(params).length > 0) {
            return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] || match;
            });
        }
        
        return translation;
    }
    
    setLanguage(lang) {
        if (!translations[lang]) {
            console.warn(`Language ${lang} not found, falling back to English`);
            lang = 'en';
        }
        
        this.currentLanguage = lang;
        this.direction = this.getDirection(lang);
        localStorage.setItem('cargowatch_lang', lang);
        
        // Mettre à jour l'attribut dir et lang du document
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', this.direction);
        
        // Appliquer les traductions
        this.updatePage();
    }
    
    updatePage() {
        // Traduire tous les éléments avec data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (!key) return;
            
            const translation = this.t(key);
            if (!translation || translation === key) {
                // Si la traduction n'existe pas, on garde le texte par défaut
                return;
            }
            
            // Gérer les placeholders pour les inputs
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Traduire les attributs title et aria-label
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });
        
        // Mettre à jour les options de sélection de langue
        const langSelector = document.getElementById('language-selector');
        if (langSelector) {
            langSelector.value = this.currentLanguage;
        }
        
        // Déclencher un événement personnalisé pour les scripts qui ont besoin de savoir que la langue a changé
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLanguage, direction: this.direction } 
        }));
    }
    
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    getAvailableLanguages() {
        return Object.keys(translations).map(lang => ({
            code: lang,
            name: this.getLanguageName(lang)
        }));
    }
    
    getLanguageName(code) {
        const names = {
            en: 'English',
            fr: 'Français',
            es: 'Español',
            de: 'Deutsch',
            pt: 'Português',
            it: 'Italiano',
            zh: '中文',
            ja: '日本語',
            ru: 'Русский',
            ar: 'العربية'
        };
        return names[code] || code;
    }
}

// Créer une instance globale
window.i18n = new I18n();

// Afficher la langue détectée dans la console (pour debug)
console.log('🌍 Langue du navigateur détectée:', navigator.language);
console.log('🌍 Langues préférées:', navigator.languages);
console.log('✅ Langue appliquée:', window.i18n.getCurrentLanguage());

// Initialiser la langue au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.i18n) {
            window.i18n.updatePage();
        }
    });
} else {
    // DOM déjà chargé
    if (window.i18n) {
        window.i18n.updatePage();
    }
}

