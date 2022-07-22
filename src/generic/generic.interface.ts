



export interface ServiceInterface {
    create: (publish_id: string, publishItemDto: any) => Promise<any>;
    updateItem: (item_id: string, updateDoc: any) => Promise<any>;
    deleteItem: (item_id: string) => Promise<any>;
    getItem: (item_id: string) => Promise<any>;
    retrieveItems: (filter: { [key: string]: any }) => Promise<any>;
}