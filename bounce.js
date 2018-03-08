//Para a animação do marcador
ol.Feature.prototype.stopBouncing = function () {

    //Durante o clique o usuário pode disparar o evento no marcador ou no raio da segunda feature em formato de ondas.
    //Logo é verificado a origim da feature e a solição de stop é realizada.
    (this._reference || this )._stopBouncing = true;
}

//Pausa a animação da feature
ol.Feature.prototype.pauseBouncing = function () {

    //Caso o stop tenha sido solicitado o pause não é executado
    if (this._stopBouncing)
        return;

    this._pauseBouncing = true;

    clearTimeout(this.bouncingTimeout);

    //Permite que a animação inicie novamente
    var play = function (feature) {

        //O pause deverá permitir novamente a animação somente se o stopBouncing estive com o valor que permita o mesmo.
        //Logo o valor do pause é o próprio valor do stopBouncing para evitar problemas de sincronização na solicitação de stop e pause.
        feature._pauseBouncing = feature._stopBouncing;

    };

    //Caso o stop tenha sido invocado, a solicitação para que o marcador inicie novamente a animação é cancelada
    if (!this._stopBouncing)
        this.bouncingTimeout = setTimeout(play, 5000, this);

}

//Inicia a animação de pulo, "bounce", do marcador.
//Durante a inicialização a animação de radar, circulos vermlhos ao redor do ícone, também é adicionada. 
//Ao realizar a animação do radar uma nova feature é criada durante o processo e adiconada a layer.
//@_map: instância do mapa no qual o marcado esta adicionado
//@layerGroup: layer na qual a feature pertence
ol.Feature.prototype.playBouncing = function (_map, layerGroup) {

    //Caso seja a feature criada durante a animação o processo de animação não deve ocorrer.
    if (this._reference)
        return;

    //duração da animação em segundos
    let duration = 1200;

    //Referência a animação ocorrida em cada quadro.
    //Quando o quadro da animação termina, após o tempo de duração o mesmo é removido utilizando o ol.Observable.unByKey(listener)
    let listenerKey;

    //Direção do marcador
    //para cima os valores são negativos
    //para baixo os valores são positivos
    let way = { up: 1, down: -1 };

    //Momento em que a animação começou
    let start = new Date().getTime();

    //Verifica se é a primeira vez que o método é chamado e inicializa os objetos
    if (this.bouncing == undefined) {

        //Estado que para a animação
        this._stopBouncing = false;

        //Estado que pausa a animação
        this._pauseBouncing = false;

        //Estado informando que a animação esta ocorrendo
        this.bouncing = true;

        //Salva a posição inicial do marcador
        this.position = this.getGeometry().clone();

        //Informa a posição inicial do marcador
        this.direction =  way.up;

        //Feature referente a animação do radar
        var circlefeature = new ol.Feature({});

        //Layer ao qual a animação pertence
        layerGroup.getSource().addFeature(circlefeature);

        circlefeature.setGeometry(this.getGeometry().clone());

        circlefeature.setStyle(this.getStyle());

        circlefeature._reference = this;

        //Faz a referência da animação de círculos na feature atual
        this.circleFeature = circlefeature;

        //salva a resolução atual para que quando a resolução mude a referência do objeto não é atualizada durante a animação.
        //Logo a cada alteração de resolução o marcador tem a sua localização setada para sua origem de forma imediata.
        this.resolution = _map.getView().getResolution();

        listenerKey = _map.on('postcompose', Animate, { feature: this, map: _map });


    }    

    //Função responsável por executar a animação quadro a quadro
    function Animate(event) {       

        //Este estado informa ao programa se a animação precisa ser resetada, isso impede que o marcador fique 
        //abaixo da sua origem durante a animação
        let restart = false;

        let frameState = event.frameState;
        let elapsed = (frameState.time - start);
        let elapsedSize = (elapsed / duration);

        var direction = this.feature.direction;

        var position = this.feature.getGeometry().getCoordinates();

        //A posição atual do marcador é definda pela posição atual, mais a função que incrementa a sua posição a cada quadro, frame, da animação.
        //A resolução é utilizada como referência para que a posição sejá proporcional a resolução do mapa.
        //E por fim a direção do marcador é aplicada durante a definição de sua posição, para informar se o marcador deve subir ou descer durante a animação.
        position[1] = position[1] + (ol.easing.upAndDown(elapsedSize) * this.map.getView().getResolution() * direction);

        //Caso a animação eseja pausda o marcador tem a sua posição definida para a sua origem
        if (this.feature._pauseBouncing)
        {
            this.feature.getGeometry().setCoordinates(this.feature.position.getCoordinates());
        }
        else
        {
            //verifica o sentido do movimento do marcador (up: Subindo, down Descendo)
            if (direction === way.down) {

                //Quando a direção do marcador for decaindo somente será atualizado caso a nova posição seja sempre
                //maior que a posição orinal do marcador, evitando que sua posição sejá abaixo da posição original
                if (position[1] >= this.feature.position.getCoordinates()[1]) {
                    this.feature.getGeometry().setCoordinates([position[0], position[1], 0]);
                }

                //Reseta a animação para que o marcador suba novamente durante a animação.
                //A animação apenas é reseta quando a nova posição é menor que a sua coordenada original
                if (position[1] <= this.feature.position.getCoordinates()[1]) {
                    restart = true;
                }

            }
            else
            {
                //Atualiza a posição do marcador com a nova posição
                //verifica se a posição atual é maior do que a última atinginda
                if (this.feature.upMax != undefined && position[1] > this.feature.upMax)
                {
                    //caso a nova posição ultrapasse os limites a última posição máxima é atribuída
                    this.feature.getGeometry().setCoordinates([position[0], this.feature.upMax, 0]);
                }
                else
                {
                    this.feature.getGeometry().setCoordinates([position[0], position[1], 0]);
                }
                
            }
        }        

        var elapsedRatio_a = elapsed / 1500;
        var elapsedRatio_b = elapsed / 3000;
        var elapsedRatio_c = elapsed / 6000;

        //O raio irá começar de 5 e irá até 45
        var radius_a = ol.easing.easeOut(elapsedRatio_a) * 45 + 5;
        var radius_b = ol.easing.easeOut(elapsedRatio_b) * 45 + 5;
        var radius_c = ol.easing.easeOut(elapsedRatio_c) * 45 + 0;

        var opacity_a = 1 - ol.easing.easeOut(elapsedRatio_a);
        var opacity_b = 1 - (ol.easing.easeOut(elapsedRatio_b) + 0.07);
        var opacity_c = 1 - (ol.easing.easeOut(elapsedRatio_c) + 0.07);

        var styleb = new ol.style.Style({
            image: new ol.style.Circle({
                radius: Math.abs(radius_b),
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity_b + ')',
                    width: 0.35 + opacity_b
                })
            })
        });

        var stylec = new ol.style.Style({
            image: new ol.style.Circle({
                radius: Math.abs(radius_c),
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity_c + ')',
                    width: 0.35 + opacity_c
                })
            })
        });

        var style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: Math.abs(radius_a),
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity_a + ')',
                    width: 0.35 + opacity_a
                })
            })
        });

        //A animação das ondas irá ocorrer apenas uma fez durante o ciclo de animação.
        if (direction == way.up)
            this.feature.circleFeature.setStyle([style, styleb, stylec]);

        //Caso a resolução tenha alterado os marcadores voltam para a posição inicial
        if (this.feature.resolution != this.map.getView().getResolution()) {

            this.feature.getGeometry().setCoordinates(this.feature.position.getCoordinates(), true);

            //a resolução atual é armazenada
            this.feature.resolution = this.map.getView().getResolution();
        }

        //Ao final do quadro de animação, durante o tempo específicado, ou quando a animação é resetada
        if (elapsed >= duration || restart) {

            var circleStyles = this.feature.circleFeature.getStyle();

            //Os estilos das ondas são removidos
            if (circleStyles.forEach)
                circleStyles.forEach(function (item) {
                    item.getImage().setOpacity(0);
                });

            //O listener é removido
            ol.Observable.unByKey(listenerKey);

            //Caso a animação esteja no estado parado a animação não irá ocorrer novamente e o marcador volta para a posição inicial
            this.map.render();

            if (this.feature._stopBouncing)
            {

                this.feature.getGeometry().setCoordinates(this.feature.position.getCoordinates(), false);
                return;
            }
            else
            {
                //Inicia uma nova animação
                start = new Date().getTime();

                restart = false;

                //atualiza com a última posição máxima atingida
                if (this.feature.upMax == undefined && this.feature.direction == way.up)
                    this.feature.upMax = position[1];

                this.feature.direction = this.feature.direction * way.down;

                //Solicita uma nova animação e adiciona a referência novamente para o listener
                listenerKey = _map.on('postcompose', Animate, { feature: this.feature, map: this.map });                

                return;
            }

        } //if

    };//function Animate

}
