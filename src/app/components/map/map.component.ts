import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import PocketBase, { RecordModel } from 'pocketbase';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  private map!: mapboxgl.Map;
  private pb = new PocketBase('https://db.buckapi.lat:8015');
  private markers: Map<string, mapboxgl.Marker> = new Map();
constructor(public global: GlobalService){}
  async ngAfterViewInit() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-75.576, 6.244], // Medellín
      zoom: 13,
      accessToken: 'pk.eyJ1IjoiY29uZWN0YXZldC1jb20iLCJhIjoiY20ybDZpc2dmMDhpMDJpb21iZGI1Y2ZoaCJ9.WquhO_FA_2FM0vhYBaZ_jg',
      attributionControl: false
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.on('load', () => {
      setTimeout(() => this.map.resize(), 300);
    });
    
    await this.cargarLocales();
    this.fitToBounds();
    // Real-time updates
    this.pb.collection('usuariosPartner').subscribe('*', (e) => {
      this.actualizarMarcadores(e.record);
    });
  }

  fitToBounds() {
    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach(marker => bounds.extend(marker.getLngLat()));
    this.map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
  }
  
  async cargarLocales() {
    const locales = await this.pb.collection('usuariosPartner').getFullList();

    locales.forEach((local: any) => {
      this.agregarMarcador(local);
    });
  }


      agregarMarcador(local: RecordModel) {
        const lat = parseFloat(local['lat']);
        const lng = parseFloat(local['lng']);
        if (isNaN(lat) || isNaN(lng)) return;
      
        const el = document.createElement('div');
        el.className = 'custom-marker';
      
        const img = document.createElement('img');
        img.src = local['files'][0] || '';
        img.alt = local['venueName'] || 'Local';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.style.border = '2px solid white';
        img.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.5)';
      
        el.appendChild(img);
      
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="popup-content">
              <h3>${local['venueName']}</h3>
              <p>${local['address']}</p>
              <button id="preview-${local.id}" class="btn btn-primary btn-sm mt-2">Ver detalle</button>
            </div>
          `))
          .addTo(this.map);
      
        this.markers.set(local.id, marker);
      
        // Agrega el event listener al botón cuando se abre el popup
        marker.getPopup()?.on('open', () => {
          setTimeout(() => {
            const btn = document.getElementById(`preview-${local.id}`);
            if (btn) {
              btn.addEventListener('click', () => {
                this.global.previewPartner(local);
              });
            }
          }, 0);
        });
      }
  actualizarMarcadores(local: RecordModel) {
    const lat = parseFloat(local['lat']);
    const lng = parseFloat(local['lng']);
    const existingMarker = this.markers.get(local.id);

    if (existingMarker) {
      existingMarker.setLngLat([lng, lat]);
    } else {
      this.agregarMarcador(local);
    }
  }

  ngOnDestroy() {
    this.pb.collection('usuariosPartner').unsubscribe('*');
    this.map.remove();
  }
  
}
