/**
 * Simulation de Data pour le front, en attendant la partie back.
 * @type {{users: [{id: string, name: string, password: string},{id: string, name: string, password: string},{id: string, name: string, password: string},{id: string, name: string, password: string}], salons: [{id: string, name: string, members: string[]},{id: string, name: string, members: string[]},{id: string, name: string, members: string[]}], messagesSalons: {"1": [{id: number, userId: string, content: string, date: string},{id: number, userId: string, content: string, date: string}], "2": [{id: number, userId: string, content: string, date: string}], "3": *[]}, dm: [{id: number, userId1: string, userId2: string, messages: [{id: number, userId: string, content: string, date: string},{id: number, userId: string, content: string, date: string}]},{id: number, userId1: string, userId2: string, messages: [{id: number, userId: string, content: string, date: string}]},{id: number, userId1: string, userId2: string, messages: *[]}]}}
 */
const mockData = {

    users: [
    ],

    salons: [
    ],

    //les id principal sont les id des salons, comme ca on peut facilement récupérer les messages d'un salon
    messagesSalons: {
    },

    dm: [
    ],
}

export default mockData;