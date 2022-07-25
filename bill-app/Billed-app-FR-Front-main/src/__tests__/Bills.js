/**
* @jest-environment jsdom
*/

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toBe("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  
  describe("When I click on the new bill button", () => { // handleClickNewBill for container/Bills.js
    test("It should open a new bill page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = BillsUI({data : bills}) // build user interface
      const bill = new Bills({
        document, onNavigate, store: null, bills, localStorage: window.localStorage
      });
      $.fn.modal = jest.fn() // mock le comportement 
      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e)); // Mock handleClickNewBill
      const newBill = screen.getByTestId('btn-new-bill'); // get dans le DOM
      newBill.addEventListener("click", handleClickNewBill); // Evenement
      fireEvent.click(newBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy() // Affichage du message "envoyer une note de frais"
    });
  })
  
  describe('When I click on the icon eye to show details of bill', () => { // handleClickIconEye for container/Bills.js
    test('A modal should open', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      bills[0].fileUrl = "test.jpg";
      document.body.innerHTML = BillsUI({data: bills}); // build user interface
      const eyeBill = new Bills({
        document, onNavigate, store: null, bills, localStorage: window.localStorage
      });
      $.fn.modal = jest.fn() // mock le comportement 
      let eye = screen.getAllByTestId('icon-eye'); //get buton eye dans le DOM
      console.log (eye)
      const handleClickIconEye = jest.fn((e) => eyeBill.handleClickIconEye(eye[0])); //mock la function handleClickIconEye
      eye[0].addEventListener('click', handleClickIconEye); //event 
      fireEvent.click(eye[0]); 
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById('modaleFile');
      expect(modale).toBeTruthy();
      expect($.fn.modal).toHaveBeenCalled();
    });
    
    test('A modal should open with error', () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      bills[0].fileUrl = "test.docx";
      document.body.innerHTML = BillsUI({data: bills}); // build user interface
      const eyeBill = new Bills({
        document, onNavigate, store: null, bills, localStorage: window.localStorage
      });
      $.fn.modal = jest.fn() // mock le comportement 
      let eye = screen.getAllByTestId('icon-eye'); //get buton eye dans le DOM
      console.log (eye)
      const handleClickIconEye = jest.fn((e) => eyeBill.handleClickIconEye(eye[0])); //mock la function handleClickIconEye
      eye[0].addEventListener('click', handleClickIconEye); //event 
      fireEvent.click(eye[0]); 
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById('modaleFile');
      expect(modale).toBeTruthy();
      expect($.fn.modal).toHaveBeenCalled();
    });
    
  });
})

//--------------------------------------------------------------------//

// test d'intégration GET Bills
describe ("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => { 
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const getSpy = jest.spyOn(mockStore, "bills");
      const isBills = mockStore.bills ();
      const bills = await isBills.list(); // get bills et new bills
      document.body.innerHTML = BillsUI({data:bills});
      const bill = new Bills ({document, onNavigate, store:mockStore, bills:bills, localStorage:window.localStorage});
      expect(getSpy).toHaveBeenCalledTimes(1); // appel de getSpy au moins une fois
      expect(bills).toBeDefined()
      expect(bills.length).toBe(4); // nombre de bills
    })
    
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window,'localStorage',{ value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({type: 'Employee',email: "a@a"}))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return Promise.reject (new Error("Erreur 404"))
        })
        const html = BillsUI ({error:"Erreur 404"});
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      
      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return Promise.reject (new Error("Erreur 500"))
        })
        const html = BillsUI ({error:"Erreur 500"});
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})

